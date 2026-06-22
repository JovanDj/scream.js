import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it, type TestContext } from "node:test";
import { InMemoryFileLoader } from "./in-memory-file-loader.js";
import {
	HtmlAttributes,
	SafeHtml,
	ScreamTemplateEngine,
	TemplateGroupFileLoader,
} from "./template-engine.js";

describe("ScreamTemplateEngine", { concurrency: true }, () => {
	const setupTemplateEngine = () => {
		const fileLoader = new InMemoryFileLoader();
		const templateEngine = ScreamTemplateEngine.create(fileLoader);

		return { fileLoader, templateEngine };
	};

	describe("attribute references", () => {
		it("renders scalar attributes with HTML escaping", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render("Hello, {{ name }}!", {
				name: "<Admin>",
			});

			t.assert.deepStrictEqual<string>(result, "Hello, &lt;Admin&gt;!");
		});

		it("renders trusted SafeHtml without escaping", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render("{{ content }}", {
				content: SafeHtml.fromTrustedHtml("<strong>Hi</strong>"),
			});

			t.assert.deepStrictEqual<string>(result, "<strong>Hi</strong>");
		});

		it("renders missing attributes as an empty string", (t: TestContext) => {
			t.plan(3);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render("Hello, {{ name }}!", {});

			t.assert.deepStrictEqual<string>(result, "Hello, !");
			t.assert.deepStrictEqual<string>(
				templateEngine.render("Hello, {{ name }}!", { name: null }),
				"Hello, !",
			);
			t.assert.deepStrictEqual<string>(
				templateEngine.render("Hello, {{ name }}!", { name: undefined }),
				"Hello, !",
			);
		});

		it("rejects bracket path expressions", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render("{{ errors.title[0] }}", {
					errors: { title: ["Required"] },
				});

			t.assert.throws(act, /Malformed path expression|Unexpected character/);
		});

		it("rejects method calls and operators", (t: TestContext) => {
			t.plan(4);
			const { templateEngine } = setupTemplateEngine();

			t.assert.throws(
				() => templateEngine.render("{{ user.name() }}", { user: {} }),
				/Malformed path expression|Unexpected character/,
			);
			t.assert.throws(
				() =>
					templateEngine.render("{{ price * quantity }}", {
						price: 2,
						quantity: 3,
					}),
				/Malformed path expression|Unexpected character/,
			);
			t.assert.throws(
				() => templateEngine.render("{% if count > 0 %}A{% endif %}", {}),
				/Malformed path expression|Unexpected character/,
			);
			t.assert.throws(
				() =>
					templateEngine.render('{% if role == "admin" %}A{% endif %}', {
						role: "admin",
					}),
				/Malformed path expression|Unexpected character/,
			);
		});

		it("rejects literal expressions", (t: TestContext) => {
			t.plan(6);
			const { templateEngine } = setupTemplateEngine();

			t.assert.throws(() => templateEngine.render("{{ true }}", {}), /literal/);
			t.assert.throws(
				() => templateEngine.render("{{ false }}", {}),
				/literal/,
			);
			t.assert.throws(() => templateEngine.render("{{ null }}", {}), /literal/);
			t.assert.throws(
				() => templateEngine.render("{{ undefined }}", {}),
				/literal/,
			);
			t.assert.throws(() => templateEngine.render("{{ NaN }}", {}), /literal/);
			t.assert.throws(
				() => templateEngine.render("{{ Infinity }}", {}),
				/literal/,
			);
		});

		it("rejects array path traversal", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render("{{ todos.length }}", { todos: ["A"] });

			t.assert.throws(act, /Cannot access array value/);
		});

		it("rejects direct non-scalar rendering", (t: TestContext) => {
			t.plan(4);
			const { templateEngine } = setupTemplateEngine();

			t.assert.throws(
				() => templateEngine.render("{{ value }}", { value: {} }),
				/Cannot render value/,
			);
			t.assert.throws(
				() => templateEngine.render("{{ value }}", { value: [] }),
				/Cannot render value/,
			);
			t.assert.throws(
				() => templateEngine.render("{{ value }}", { value: () => "nope" }),
				/Cannot render value/,
			);
			t.assert.throws(
				() => templateEngine.render("{{ value }}", { value: Symbol("nope") }),
				/Cannot render value/,
			);
		});

		it("renders prepared HtmlAttributes with escaped values", (t: TestContext) => {
			t.plan(3);
			const { templateEngine } = setupTemplateEngine();

			const directResult = templateEngine.render("{{ attrs }}", {
				attrs: HtmlAttributes.fromRecord({
					class: "todo-row",
					disabled: true,
				}),
			});
			const tagResult = templateEngine.render(
				"<button{{ attrs }}>Save</button>",
				{
					attrs: HtmlAttributes.fromRecord({
						class: 'primary&"<',
						disabled: true,
						hidden: false,
						tabindex: 0,
						title: undefined,
					}),
				},
			);
			const emptyResult = templateEngine.render(
				"<button{{ attrs }}>Save</button>",
				{
					attrs: null,
				},
			);

			t.assert.deepStrictEqual<string>(
				directResult,
				' class="todo-row" disabled',
			);
			t.assert.deepStrictEqual<string>(
				tagResult,
				'<button class="primary&amp;&quot;&lt;" disabled tabindex="0">Save</button>',
			);
			t.assert.deepStrictEqual<string>(emptyResult, "<button>Save</button>");
		});

		it("rejects unsafe HtmlAttributes placement and names", (t: TestContext) => {
			t.plan(2);
			const { templateEngine } = setupTemplateEngine();

			t.assert.throws(
				() =>
					templateEngine.render("<div{{ attrs }}></div>", {
						attrs: "class=todo-row",
					}),
				/Only HtmlAttributes can render in attribute position/,
			);
			t.assert.throws(
				() =>
					templateEngine.render("{{ attrs }}", {
						attrs: HtmlAttributes.fromRecord({
							"bad name": "value",
						}),
					}),
				/Invalid HTML attribute name/,
			);
		});
	});

	describe("presence conditionals", () => {
		it("renders the primary branch when an attribute is present", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render(
				"{% if title %}<h1>{{ title }}</h1>{% else %}<p>Untitled</p>{% endif %}",
				{ title: "Hello" },
			);

			t.assert.deepStrictEqual<string>(result, "<h1>Hello</h1>");
		});

		it("renders the alternate branch when an attribute is missing", (t: TestContext) => {
			t.plan(3);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render(
				"{% if title %}<h1>{{ title }}</h1>{% else %}<p>Untitled</p>{% endif %}",
				{},
			);

			t.assert.deepStrictEqual<string>(result, "<p>Untitled</p>");
			t.assert.deepStrictEqual<string>(
				templateEngine.render(
					"{% if title %}<h1>{{ title }}</h1>{% else %}<p>Untitled</p>{% endif %}",
					{ title: null },
				),
				"<p>Untitled</p>",
			);
			t.assert.deepStrictEqual<string>(
				templateEngine.render(
					"{% if title %}<h1>{{ title }}</h1>{% else %}<p>Untitled</p>{% endif %}",
					{ title: undefined },
				),
				"<p>Untitled</p>",
			);
		});

		it("treats false, zero, and empty string as present values", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render(
				"{% if active %}A{% endif %}{% if count %}B{% endif %}{% if label %}C{% endif %}",
				{ active: false, count: 0, label: "" },
			);

			t.assert.deepStrictEqual<string>(result, "ABC");
		});

		it("rejects literal conditions", (t: TestContext) => {
			t.plan(2);
			const { templateEngine } = setupTemplateEngine();

			t.assert.throws(
				() => templateEngine.render("{% if true %}A{% endif %}", {}),
				/literal/,
			);
			t.assert.throws(
				() => templateEngine.render("{% if false %}A{% endif %}", {}),
				/literal/,
			);
		});

		it("rejects array length conditions", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render("{% if todos.length %}A{% else %}B{% endif %}", {
					todos: ["A"],
				});

			t.assert.throws(act, /Cannot access array value/);
		});
	});

	describe("template application", () => {
		it("applies an anonymous template to every item", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render(
				"<ul>{% apply users %}<li>{{ attr.name }}</li>{% endapply %}</ul>",
				{ users: [{ name: "Ada" }, { name: "Grace" }] },
			);

			t.assert.deepStrictEqual<string>(
				result,
				"<ul><li>Ada</li><li>Grace</li></ul>",
			);
		});

		it("renders nothing when applying a missing attribute", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render(
				"Before{% apply users %}<li>{{ attr.name }}</li>{% endapply %}After",
				{},
			);

			t.assert.deepStrictEqual<string>(result, "BeforeAfter");
		});

		it("applies an anonymous template once to a single value", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render(
				"{% apply user %}<p>{{ attr.name }}</p>{% endapply %}",
				{ user: { name: "Ada" } },
			);

			t.assert.deepStrictEqual<string>(result, "<p>Ada</p>");
		});

		it("applies a named template to every item", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render(
				"{% template row %}<li>{{ attr.name }}</li>{% endtemplate %}<ul>{% apply users to row %}</ul>",
				{ users: [{ name: "Ada" }, { name: "Grace" }] },
			);

			t.assert.deepStrictEqual<string>(
				result,
				"<ul><li>Ada</li><li>Grace</li></ul>",
			);
		});

		it("applies named templates round-robin", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render(
				'{% template odd %}<li class="odd">{{ attr.name }}</li>{% endtemplate %}{% template even %}<li class="even">{{ attr.name }}</li>{% endtemplate %}<ul>{% apply users to odd, even %}</ul>',
				{ users: [{ name: "Ada" }, { name: "Grace" }, { name: "Linus" }] },
			);

			t.assert.deepStrictEqual<string>(
				result,
				'<ul><li class="odd">Ada</li><li class="even">Grace</li><li class="odd">Linus</li></ul>',
			);
		});

		it("does not inherit the outer context inside applied templates", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render(
				"{% apply users %}<p>{{ pageTitle }}:{{ attr.name }}</p>{% endapply %}",
				{
					pageTitle: "Users",
					users: [{ name: "Ada" }],
				},
			);

			t.assert.deepStrictEqual<string>(result, "<p>:Ada</p>");
		});

		it("does not inherit the outer context inside file-backed applied templates", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"user-row.scream",
				"<p>{{ pageTitle }}:{{ attr.name }}</p>",
			);

			const result = templateEngine.render(
				'{% apply users to "user-row.scream" %}',
				{
					pageTitle: "Users",
					users: [{ name: "Ada" }],
				},
			);

			t.assert.deepStrictEqual<string>(result, "<p>:Ada</p>");
		});

		it("applies a file-backed template to every item", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("user-row.scream", "<li>{{ attr.name }}</li>");

			const result = templateEngine.render(
				'<ul>{% apply users to "user-row.scream" %}</ul>',
				{ users: [{ name: "Ada" }, { name: "Grace" }] },
			);

			t.assert.deepStrictEqual<string>(
				result,
				"<ul><li>Ada</li><li>Grace</li></ul>",
			);
		});

		it("applies file-backed templates round-robin", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"odd-row.scream",
				'<li class="odd">{{ attr.name }}</li>',
			);
			fileLoader.setTemplate(
				"even-row.scream",
				'<li class="even">{{ attr.name }}</li>',
			);

			const result = templateEngine.render(
				'<ul>{% apply users to "odd-row.scream", "even-row.scream" %}</ul>',
				{ users: [{ name: "Ada" }, { name: "Grace" }, { name: "Linus" }] },
			);

			t.assert.deepStrictEqual<string>(
				result,
				'<ul><li class="odd">Ada</li><li class="even">Grace</li><li class="odd">Linus</li></ul>',
			);
		});

		it("renders file-backed applied templates containing includes and applications", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"user-row.scream",
				'<li>{% include "name.scream" %}<ul>{% apply attr.tags %}<li>{{ attr }}</li>{% endapply %}</ul></li>',
			);
			fileLoader.setTemplate("name.scream", "{{ attr.name }}");

			const result = templateEngine.render(
				'<ul>{% apply users to "user-row.scream" %}</ul>',
				{ users: [{ name: "Ada", tags: ["admin"] }] },
			);

			t.assert.deepStrictEqual<string>(
				result,
				"<ul><li>Ada<ul><li>admin</li></ul></li></ul>",
			);
		});

		it("allows named templates to apply themselves recursively", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render(
				"{% template node %}<li>{{ attr.name }}<ul>{% apply attr.children to node %}</ul></li>{% endtemplate %}<ul>{% apply tree to node %}</ul>",
				{
					tree: [
						{
							children: [{ name: "Child" }],
							name: "Parent",
						},
					],
				},
			);

			t.assert.deepStrictEqual<string>(
				result,
				"<ul><li>Parent<ul><li>Child<ul></ul></li></ul></li></ul>",
			);
		});

		it("throws for an unknown named template", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render("{% apply users to row %}", { users: [] });

			t.assert.throws(act, /Unknown template: row/);
		});

		it("throws for an unknown named template with a missing source", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () => templateEngine.render("{% apply users to row %}", {});

			t.assert.throws(act, /Unknown template: row/);
		});

		it("throws for an unknown named template in an unselected branch", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render(
					"{% if missing %}{% apply users to row %}{% endif %}",
					{},
				);

			t.assert.throws(act, /Unknown template: row/);
		});

		it("throws for duplicate named templates", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render(
					"{% template row %}A{% endtemplate %}{% template row %}B{% endtemplate %}",
					{},
				);

			t.assert.throws(act, /Duplicate template: row/);
		});

		it("rejects invalid file-backed applied template paths", (t: TestContext) => {
			t.plan(5);
			const { templateEngine } = setupTemplateEngine();

			for (const templateName of [
				"/row.scream",
				"./row.scream",
				"../row.scream",
				"partials/../row.scream",
				"row.html",
			]) {
				t.assert.throws(
					() =>
						templateEngine.render(`{% apply users to "${templateName}" %}`, {
							users: [],
						}),
					/Invalid template path|Applied templates must use the .scream extension/,
				);
			}
		});

		it("rejects missing file-backed applied templates", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render('{% apply users to "missing.scream" %}', {
					users: [],
				});

			t.assert.throws(act, /Template not found/);
		});

		it("rejects cycles across includes and file-backed applied templates", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"row.scream",
				'{% include "shared.scream" %}<li>{{ attr.name }}</li>',
			);
			fileLoader.setTemplate(
				"shared.scream",
				'{% apply users to "row.scream" %}',
			);

			const act = () =>
				templateEngine.render('{% apply users to "row.scream" %}', {
					users: [{ name: "Ada" }],
				});

			t.assert.throws(
				act,
				/Cyclic template reference detected: row\.scream -> shared\.scream -> row\.scream/,
			);
		});

		it("rejects extends and block directives inside file-backed applied templates", (t: TestContext) => {
			t.plan(2);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"with-extends.scream",
				'{% extends "layout.scream" %}',
			);
			fileLoader.setTemplate(
				"with-block.scream",
				"{% block content %}X{% endblock content %}",
			);

			t.assert.throws(
				() =>
					templateEngine.render('{% apply users to "with-extends.scream" %}', {
						users: [],
					}),
				/Applied templates cannot contain extends directives/,
			);
			t.assert.throws(
				() =>
					templateEngine.render('{% apply users to "with-block.scream" %}', {
						users: [],
					}),
				/Applied templates cannot contain block directives/,
			);
		});
	});

	describe("removed syntax", () => {
		it("rejects explicit for loops", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render("{% for item in items %}{{ item }}{% endfor %}", {
					items: ["A"],
				});

			t.assert.throws(act, /Unsupported directive: for/);
		});

		it("rejects conditional attr directives", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render(
					"<option{% attr selected if selected %}>A</option>",
					{
						selected: true,
					},
				);

			t.assert.throws(act, /Unsupported directive: attr/);
		});

		it("rejects custom logic directives", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render("{% custom thing %}Nope{% endcustom %}", {});

			t.assert.throws(act, /Unknown directive/);
		});
	});

	describe("model-view separation", () => {
		it("rejects literal URL values in URL-bearing attributes", (t: TestContext) => {
			const urlAttributes = [
				"action",
				"cite",
				"formaction",
				"href",
				"manifest",
				"poster",
				"src",
				"srcset",
			];
			t.plan(urlAttributes.length + 4);
			const { templateEngine } = setupTemplateEngine();

			for (const attribute of urlAttributes) {
				t.assert.throws(
					() => templateEngine.render(`<x ${attribute}="/todos"></x>`, {}),
					/URL attributes must use one complete attribute reference/,
				);
			}

			t.assert.throws(
				() => templateEngine.render('<a href="todos">Todos</a>', {}),
				/URL attributes must use one complete attribute reference/,
			);
			t.assert.throws(
				() =>
					templateEngine.render(
						'<a href="https://example.com">External</a>',
						{},
					),
				/URL attributes must use one complete attribute reference/,
			);
			t.assert.throws(
				() => templateEngine.render('<a href="//example.com">External</a>', {}),
				/URL attributes must use one complete attribute reference/,
			);
			t.assert.throws(
				() => templateEngine.render('<a href="#content">Skip</a>', {}),
				/URL attributes must use one complete attribute reference/,
			);
		});

		it("rejects route URLs composed from attributes and literal path fragments", (t: TestContext) => {
			t.plan(3);
			const { templateEngine } = setupTemplateEngine();

			t.assert.throws(
				() =>
					templateEngine.render('<a href="{{ base }}/todos">Todos</a>', {
						base: "",
					}),
				/URL attributes must use one complete attribute reference/,
			);
			t.assert.throws(
				() =>
					templateEngine.render(
						'<a href="{{ todosUrl }}/{{ todo.id }}">Todo</a>',
						{
							todo: { id: 1 },
							todosUrl: "/todos",
						},
					),
				/URL attributes must use one complete attribute reference/,
			);
			t.assert.throws(
				() =>
					templateEngine.render("<a href={{ base }}/todos>Todos</a>", {
						base: "",
					}),
				/Dynamic attribute values must be quoted/,
			);
		});

		it("rejects variables in unquoted attribute values", (t: TestContext) => {
			t.plan(5);
			const { templateEngine } = setupTemplateEngine();

			t.assert.throws(
				() => templateEngine.render("<div class={{ value }}></div>", {}),
				/Dynamic attribute values must be quoted/,
			);
			t.assert.throws(
				() => templateEngine.render("<div class=item-{{ state }}></div>", {}),
				/Dynamic attribute values must be quoted/,
			);
			t.assert.throws(
				() => templateEngine.render("<a href={{ url }}>Link</a>", {}),
				/Dynamic attribute values must be quoted/,
			);
			t.assert.throws(
				() =>
					templateEngine.render("<button disabled {{ attrs }}></button>", {
						attrs: "class=primary",
					}),
				/Only HtmlAttributes can render in attribute position/,
			);
			t.assert.throws(
				() =>
					templateEngine.render(
						"<div class={% if enabled %}{{ value }}{% endif %}></div>",
						{ enabled: true, value: "a b" },
					),
				/Dynamic attribute values must be quoted/,
			);
		});

		it("allows quoted non-URL dynamic attributes with escaping", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render('<div class="{{ value }}"></div>', {
				value: 'one two&"<',
			});

			t.assert.deepStrictEqual<string>(
				result,
				'<div class="one two&amp;&quot;&lt;"></div>',
			);
		});

		it("rejects variables inside script and style bodies", (t: TestContext) => {
			t.plan(4);
			const { templateEngine } = setupTemplateEngine();

			t.assert.throws(
				() => templateEngine.render("<script>{{ json }}</script>", {}),
				/Variables are not allowed inside script or style tags/,
			);
			t.assert.throws(
				() => templateEngine.render("<style>{{ css }}</style>", {}),
				/Variables are not allowed inside script or style tags/,
			);
			t.assert.throws(
				() =>
					templateEngine.render(
						"<script>{% if payload %}{{ payload }}{% endif %}</script>",
						{ payload: "{}" },
					),
				/Variables are not allowed inside script or style tags/,
			);

			const result = templateEngine.render(
				'<script src="{{ assetUrls.mainScript }}"></script>',
				{ assetUrls: { mainScript: "/assets/main.js" } },
			);

			t.assert.deepStrictEqual<string>(
				result,
				'<script src="/assets/main.js"></script>',
			);
		});

		it("renders conditional literal attributes", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render(
				'<option value="open"{% if fields.isOpen %} selected{% endif %}>Open</option>',
				{ fields: { isOpen: true } },
			);

			t.assert.deepStrictEqual<string>(
				result,
				'<option value="open" selected>Open</option>',
			);
		});

		it("allows URL attributes only when the value is one complete attribute reference", (t: TestContext) => {
			const urlAttributes = [
				"action",
				"cite",
				"formaction",
				"href",
				"manifest",
				"poster",
				"src",
				"srcset",
			];
			t.plan(urlAttributes.length);
			const { templateEngine } = setupTemplateEngine();

			for (const attribute of urlAttributes) {
				t.assert.deepStrictEqual<string>(
					templateEngine.render(`<x ${attribute}="{{ urls.todos }}"></x>`, {
						urls: { todos: "/todos" },
					}),
					`<x ${attribute}="/todos"></x>`,
				);
			}
		});

		it("does not treat custom attributes ending in URL attribute names as URL-bearing", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const result = templateEngine.render(
				'<div data-href="/todos" aria-src="/assets/app.js"></div>',
				{},
			);

			t.assert.deepStrictEqual<string>(
				result,
				'<div data-href="/todos" aria-src="/assets/app.js"></div>',
			);
		});
	});

	describe("includes", () => {
		it("renders static includes", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("partial.scream", "<p>{{ title }}</p>");

			const result = templateEngine.render(
				'Before{% include "partial.scream" %}After',
				{ title: "Hello" },
			);

			t.assert.deepStrictEqual<string>(result, "Before<p>Hello</p>After");
		});

		it("renders includes with scoped parameters", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"link.scream",
				'<a href="{{ url }}">{{ label }}</a>{{ pageTitle }}',
			);

			const result = templateEngine.render(
				'Before{% include "link.scream" with label: user.name, url: user.showUrl %}After',
				{
					pageTitle: "Users",
					user: {
						name: "Ada",
						showUrl: "/users/1",
					},
				},
			);

			t.assert.deepStrictEqual<string>(
				result,
				'Before<a href="/users/1">Ada</a>After',
			);
		});

		it("rejects scoped include variables in unquoted attribute values", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("class-name.scream", "{{ value }}");

			const act = () =>
				templateEngine.render(
					'<div class={% include "class-name.scream" with value: className %}></div>',
					{ className: "active" },
				);

			t.assert.throws(act, /Dynamic attribute values must be quoted/);
		});

		it("rejects duplicate scoped include parameters", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("partial.scream", "{{ label }}");

			const act = () =>
				templateEngine.render(
					'{% include "partial.scream" with label: first, label: second %}',
					{ first: "A", second: "B" },
				);

			t.assert.throws(act, /Duplicate template parameter: label/);
		});

		it("rejects invalid scoped include parameter expressions", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("partial.scream", "{{ label }}");

			const act = () =>
				templateEngine.render(
					'{% include "partial.scream" with label: user.name() %}',
					{ user: { name: "Ada" } },
				);

			t.assert.throws(act, /Malformed path expression|Unexpected character/);
		});

		it("renders missing scoped include parameters as absent", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"partial.scream",
				"{% if label %}{{ label }}{% else %}Missing{% endif %}",
			);

			const result = templateEngine.render(
				'{% include "partial.scream" with label: user.name %}',
				{ user: {} },
			);

			t.assert.deepStrictEqual<string>(result, "Missing");
		});

		it("resolves scoped include parameters from applied attr values", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("name.scream", "{{ label }}");

			const result = templateEngine.render(
				'{% apply users %}<p>{% include "name.scream" with label: attr.name %}</p>{% endapply %}',
				{ users: [{ name: "Ada" }] },
			);

			t.assert.deepStrictEqual<string>(result, "<p>Ada</p>");
		});

		it("rejects URL attributes composed from scoped include output", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("url.scream", "{{ url }}");

			const act = () =>
				templateEngine.render(
					'<a href="{% include "url.scream" with url: showUrl %}">Show</a>',
					{ showUrl: "/todos/1" },
				);

			t.assert.throws(
				act,
				/URL attributes must use one complete attribute reference/,
			);
		});

		it("renders nested includes", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"outer.scream",
				'<section>{% include "inner.scream" %}</section>',
			);
			fileLoader.setTemplate("inner.scream", "<p>{{ title }}</p>");

			const result = templateEngine.render('{% include "outer.scream" %}', {
				title: "Nested",
			});

			t.assert.deepStrictEqual<string>(
				result,
				"<section><p>Nested</p></section>",
			);
		});

		it("renders includes inside merged layout blocks", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"layout.scream",
				"<main>{% block content %}Default{% endblock content %}</main>",
			);
			fileLoader.setTemplate("partial.scream", "<p>{{ title }}</p>");
			fileLoader.setTemplate(
				"page.scream",
				'{% extends "layout.scream" %}{% block content %}{% include "partial.scream" %}{% endblock content %}',
			);

			const result = templateEngine.renderView("page.scream", {
				title: "Block",
			});

			t.assert.deepStrictEqual<string>(result, "<main><p>Block</p></main>");
		});

		it("renders includes containing apply and named template nodes", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"rows.scream",
				"{% template row %}<li>{{ attr.title }}</li>{% endtemplate %}<ul>{% apply todos to row %}</ul>",
			);

			const result = templateEngine.render('{% include "rows.scream" %}', {
				todos: [{ title: "Ship" }],
			});

			t.assert.deepStrictEqual<string>(result, "<ul><li>Ship</li></ul>");
		});

		it("rejects invalid static include paths", (t: TestContext) => {
			t.plan(5);
			const { templateEngine } = setupTemplateEngine();

			for (const templateName of [
				"/partial.scream",
				"./partial.scream",
				"../partial.scream",
				"partials/../partial.scream",
				"partial.html",
			]) {
				t.assert.throws(
					() => templateEngine.render(`{% include "${templateName}" %}`, {}),
					/Invalid include path|Included templates must use the .scream extension/,
				);
			}
		});

		it("rejects dynamic include names", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render("{% include partialName %}", {
					partialName: "partial.scream",
				});

			t.assert.throws(act, /Expected string token/);
		});

		it("rejects missing includes", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render('{% include "missing.scream" %}', {});

			t.assert.throws(act, /Template not found/);
		});

		it("rejects include cycles", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("a.scream", '{% include "b.scream" %}');
			fileLoader.setTemplate("b.scream", '{% include "a.scream" %}');

			const act = () => templateEngine.render('{% include "a.scream" %}', {});

			t.assert.throws(
				act,
				/Cyclic template reference detected: a\.scream -> b\.scream -> a\.scream/,
			);
		});

		it("rejects extends and block directives inside included templates", (t: TestContext) => {
			t.plan(2);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"with-extends.scream",
				'{% extends "layout.scream" %}',
			);
			fileLoader.setTemplate(
				"with-block.scream",
				"{% block content %}X{% endblock content %}",
			);

			t.assert.throws(
				() => templateEngine.render('{% include "with-extends.scream" %}', {}),
				/Included templates cannot contain extends directives/,
			);
			t.assert.throws(
				() => templateEngine.render('{% include "with-block.scream" %}', {}),
				/Included templates cannot contain block directives/,
			);
		});
	});

	describe("layouts", () => {
		it("renders parent block fallback content", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"layout.scream",
				"<main>{% block content %}Default{% endblock content %}</main>",
			);
			fileLoader.setTemplate("page.scream", '{% extends "layout.scream" %}');

			const result = templateEngine.renderView("page.scream", {});

			t.assert.deepStrictEqual<string>(result, "<main>Default</main>");
		});

		it("renders apply nodes inside merged layout blocks", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"layout.scream",
				"<main>{% block content %}Default{% endblock content %}</main>",
			);
			fileLoader.setTemplate(
				"page.scream",
				'{% extends "layout.scream" %}{% block content %}{% apply todos %}<p>{{ attr.title }}</p>{% endapply %}{% endblock content %}',
			);

			const result = templateEngine.renderView("page.scream", {
				todos: [{ title: "Ship" }],
			});

			t.assert.deepStrictEqual<string>(result, "<main><p>Ship</p></main>");
		});

		it("renders named templates inside merged layout blocks", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"layout.scream",
				"<main>{% block content %}Default{% endblock content %}</main>",
			);
			fileLoader.setTemplate(
				"page.scream",
				'{% extends "layout.scream" %}{% block content %}{% template row %}<p>{{ attr.title }}</p>{% endtemplate %}{% apply todos to row %}{% endblock content %}',
			);

			const result = templateEngine.renderView("page.scream", {
				todos: [{ title: "Ship" }],
			});

			t.assert.deepStrictEqual<string>(result, "<main><p>Ship</p></main>");
		});

		it("rejects unknown child block overrides", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"layout.scream",
				"<main>{% block content %}Default{% endblock content %}</main>",
			);
			fileLoader.setTemplate(
				"page.scream",
				'{% extends "layout.scream" %}{% block sidebar %}X{% endblock sidebar %}',
			);

			const act = () => templateEngine.renderView("page.scream", {});

			t.assert.throws(act, /Unknown template block: sidebar/);
		});

		it("rejects duplicate block definitions", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render(
					"{% block content %}A{% endblock content %}{% block content %}B{% endblock content %}",
					{},
				);

			t.assert.throws(act, /Duplicate template block: content/);
		});

		it("rejects duplicate extends directives", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render(
					'{% extends "a.scream" %}{% extends "b.scream" %}',
					{},
				);

			t.assert.throws(act, /at most one extends directive/);
		});

		it("rejects extends after meaningful content", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render('Hello{% extends "layout.scream" %}', {});

			t.assert.throws(act, /Extends must be the first meaningful directive/);
		});

		it("rejects nested block overrides in extending templates", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"layout.scream",
				"<main>{% block content %}Default{% endblock content %}</main>",
			);
			fileLoader.setTemplate(
				"page.scream",
				'{% extends "layout.scream" %}{% block content %}{% block nested %}X{% endblock nested %}{% endblock content %}',
			);

			const act = () => templateEngine.renderView("page.scream", {});

			t.assert.throws(act, /Nested template blocks are not allowed/);
		});

		it("rejects layout cycles", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("a.scream", '{% extends "b.scream" %}');
			fileLoader.setTemplate("b.scream", '{% extends "a.scream" %}');

			const act = () => templateEngine.renderView("a.scream", {});

			t.assert.throws(act, /Cyclic extends detected/);
		});

		it("rejects extends inside template application", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render(
					'{% apply items %}{% extends "layout.scream" %}{% endapply %}',
					{ items: [1] },
				);

			t.assert.throws(
				act,
				/Extends directives are only allowed at the top level/,
			);
		});
	});

	describe("template groups", () => {
		it("rejects empty template group lists", (t: TestContext) => {
			t.plan(1);

			t.assert.throws(
				() => new TemplateGroupFileLoader({ groups: [] }),
				/Template groups must not be empty/,
			);
		});

		it("rejects invalid template group names", (t: TestContext) => {
			t.plan(5);

			for (const group of ["", "/brand", "./brand", "../brand", "x/../brand"]) {
				t.assert.throws(
					() => new TemplateGroupFileLoader({ groups: [group] }),
					/Invalid template group/,
				);
			}
		});

		it("loads views from the active group before fallback groups", (t: TestContext) => {
			t.plan(2);
			const viewsRoot = mkdtempSync(
				path.join(tmpdir(), "scream-template-groups-"),
			);
			t.after(() => {
				rmSync(viewsRoot, { force: true, recursive: true });
			});
			mkdirSync(path.join(viewsRoot, "base"), { recursive: true });
			mkdirSync(path.join(viewsRoot, "brand"), { recursive: true });
			writeFileSync(
				path.join(viewsRoot, "base", "page.scream"),
				"Base {{ title }}",
			);
			writeFileSync(
				path.join(viewsRoot, "base", "shared.scream"),
				"<p>Shared {{ title }}</p>",
			);
			writeFileSync(
				path.join(viewsRoot, "brand", "page.scream"),
				'Brand {{ title }} {% include "shared.scream" %}',
			);
			const templateEngine = ScreamTemplateEngine.create(
				new TemplateGroupFileLoader({
					groups: ["brand", "base"],
					viewsRoot,
				}),
			);

			const result = templateEngine.renderView("page.scream", {
				title: "Home",
			});

			t.assert.match(result, /Brand Home/);
			t.assert.match(result, /<p>Shared Home<\/p>/);
		});

		it("rejects invalid grouped view names", (t: TestContext) => {
			t.plan(7);
			const viewsRoot = mkdtempSync(
				path.join(tmpdir(), "scream-template-groups-"),
			);
			t.after(() => {
				rmSync(viewsRoot, { force: true, recursive: true });
			});
			mkdirSync(path.join(viewsRoot, "base"), { recursive: true });
			const templateEngine = ScreamTemplateEngine.create(
				new TemplateGroupFileLoader({
					groups: ["base"],
					viewsRoot,
				}),
			);

			for (const viewName of [
				"C:page.scream",
				"nested\\page.scream",
				"/page.scream",
				"./page.scream",
				"../page.scream",
				"nested/../page.scream",
				"page.html",
			]) {
				t.assert.throws(
					() => templateEngine.renderView(viewName, {}),
					/Invalid view name/,
				);
			}
		});

		it("fails loudly when a grouped view is missing from all groups", (t: TestContext) => {
			t.plan(1);
			const viewsRoot = mkdtempSync(
				path.join(tmpdir(), "scream-template-groups-"),
			);
			t.after(() => {
				rmSync(viewsRoot, { force: true, recursive: true });
			});
			mkdirSync(path.join(viewsRoot, "base"), { recursive: true });
			const templateEngine = ScreamTemplateEngine.create(
				new TemplateGroupFileLoader({
					groups: ["base"],
					viewsRoot,
				}),
			);

			t.assert.throws(
				() => templateEngine.renderView("missing.scream", {}),
				/No file: missing\.scream/,
			);
		});

		it("uses template groups for layout inheritance and file-backed apply templates", (t: TestContext) => {
			t.plan(1);
			const viewsRoot = mkdtempSync(
				path.join(tmpdir(), "scream-template-groups-"),
			);
			t.after(() => {
				rmSync(viewsRoot, { force: true, recursive: true });
			});
			mkdirSync(path.join(viewsRoot, "base"), { recursive: true });
			mkdirSync(path.join(viewsRoot, "brand"), { recursive: true });
			writeFileSync(
				path.join(viewsRoot, "base", "layout.scream"),
				"<main>{% block content %}Default{% endblock content %}</main>",
			);
			writeFileSync(
				path.join(viewsRoot, "base", "row.scream"),
				"<p>Base {{ attr.name }}</p>",
			);
			writeFileSync(
				path.join(viewsRoot, "brand", "page.scream"),
				'{% extends "layout.scream" %}{% block content %}{% apply users to "row.scream" %}{% endblock content %}',
			);
			writeFileSync(
				path.join(viewsRoot, "brand", "row.scream"),
				"<p>Brand {{ attr.name }}</p>",
			);
			const templateEngine = ScreamTemplateEngine.create(
				new TemplateGroupFileLoader({
					groups: ["brand", "base"],
					viewsRoot,
				}),
			);

			const result = templateEngine.renderView("page.scream", {
				users: [{ name: "Ada" }],
			});

			t.assert.deepStrictEqual<string>(result, "<main><p>Brand Ada</p></main>");
		});
	});

	describe("views", () => {
		it("renders a view by logical view name", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("home.scream", "Hello, {{ name }}!");

			const result = templateEngine.renderView("home.scream", { name: "John" });

			t.assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("includes view names in syntax errors", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("broken.scream", "{% for item in items %}");

			const act = () => templateEngine.renderView("broken.scream", {});

			t.assert.throws(act, /Unsupported directive: for.*in broken\.scream/);
		});
	});
});
