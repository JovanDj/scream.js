import { describe, it, type TestContext } from "node:test";
import { InMemoryFileLoader } from "./in-memory-file-loader.js";
import { ScreamTemplateEngine } from "./template-engine.js";

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

		it("rejects direct object rendering", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const act = () => templateEngine.render("{{ user }}", { user: {} });

			t.assert.throws(act, /Cannot render value/);
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
				/URL attributes must use one complete attribute reference/,
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
				/Cyclic include detected: a\.scream -> b\.scream -> a\.scream/,
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
