import { describe, it, type TestContext } from "node:test";
import { InMemoryFileLoader } from "./in-memory-file-loader.js";
import {
	HtmlAttributes,
	SafeHtml,
	ScreamTemplateEngine,
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

		it("rejects direct HtmlAttributes rendering", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () =>
				templateEngine.render("{{ attrs }}", {
					attrs: HtmlAttributes.fromRecord({
						class: "todo-row",
						disabled: true,
					}),
				});

			t.assert.throws(act, /Cannot render HTML attributes directly/);
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
			t.plan(6);
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
				() => templateEngine.render("<div {{ attrs }}></div>", {}),
				/Dynamic attributes must be prepared by the renderer/,
			);
			t.assert.throws(
				() =>
					templateEngine.render("<button disabled {{ attrs }}></button>", {}),
				/Dynamic attributes must be prepared by the renderer/,
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
