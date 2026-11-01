import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it, type TestContext } from "node:test";
import type { RenderContext } from "./context.js";
import { InMemoryFileLoader } from "./in-memory-file-loader.js";
import * as templateEngineModule from "./template-engine.js";
import {
	FormattedDate,
	FormattedNumber,
	ScreamTemplateEngine,
	TemplateGroupFileLoader,
	TemplateSyntaxError,
} from "./template-engine.js";

describe("ScreamTemplateEngine", { concurrency: true }, () => {
	it(
		"does not expose presentation escape values",
		{ tags: ["scream-policy"] },
		(t: TestContext) => {
			t.plan(2);

			t.assert.deepStrictEqual("SafeHtml" in templateEngineModule, false);
			t.assert.deepStrictEqual("HtmlAttributes" in templateEngineModule, false);
		},
	);

	const setupTemplateEngine = () => {
		const fileLoader = new InMemoryFileLoader();
		const templateEngine = ScreamTemplateEngine.create(fileLoader);

		return { fileLoader, templateEngine };
	};

	describe("attribute references", () => {
		it(
			"should replace a root context key named like a directive",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template = "{{ attr }}";
				const context: RenderContext = { attr: "Ada" };

				const result = templateEngine.render(template, context);

				t.assert.deepStrictEqual<string>(result, "Ada");
			},
		);

		it(
			"should replace root context keys named if and for",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template = "{{ if }}|{{ for }}";
				const context: RenderContext = { for: "Collection", if: "Condition" };

				const result = templateEngine.render(template, context);

				t.assert.deepStrictEqual<string>(result, "Condition|Collection");
			},
		);

		it(
			"accepts a custom renderer through the public factory",
			{ tags: ["parr-derived", "parr-s8-1"] },
			(t: TestContext) => {
				t.plan(1);
				const templateEngine = ScreamTemplateEngine.create(
					new InMemoryFileLoader(),
					{ render: () => "Custom output" },
				);

				const result = templateEngine.render("Hello, {{ name }}!", {
					name: "Ada",
				});

				t.assert.deepStrictEqual<string>(result, "Custom output");
			},
		);

		it(
			"renders scalar attributes with HTML escaping",
			{ tags: ["parr-direct", "parr-s8-1"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const result = templateEngine.render("Hello, {{ name }}!", {
					name: "<Admin>",
				});

				t.assert.deepStrictEqual<string>(result, "Hello, &lt;Admin&gt;!");
			},
		);

		it(
			"renders formatted renderer values",
			{ tags: ["parr-direct", "parr-s8-1"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const result = templateEngine.render(
					'<p>{{ publishedAt }} {{ total }}</p><span title="{{ publishedAt }}"></span>',
					{
						publishedAt: FormattedDate.fromDate(
							new Date("2026-01-02T00:00:00.000Z"),
							"en-US",
							{ dateStyle: "medium", timeZone: "UTC" },
						),
						total: FormattedNumber.fromNumber(1234.5, "en-US", {
							currency: "USD",
							style: "currency",
						}),
					},
				);

				t.assert.deepStrictEqual<string>(
					result,
					'<p>Jan 2, 2026 $1,234.50</p><span title="Jan 2, 2026"></span>',
				);
			},
		);

		it(
			"renders missing attributes as an empty string",
			{ tags: ["parr-direct", "parr-s6"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"rejects bracket path expressions",
			{ tags: ["parr-direct", "parr-s7-r4"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () =>
					templateEngine.render("{{ errors.title[0] }}", {
						errors: { title: ["Required"] },
					});

				t.assert.throws(act, /Malformed path expression|Unexpected character/);
			},
		);

		it(
			"rejects method calls and operators",
			{
				tags: [
					"parr-derived",
					"parr-s7-r1",
					"parr-s7-r2",
					"parr-s7-r3",
					"parr-s7-r4",
				],
			},
			(t: TestContext) => {
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
			},
		);

		it(
			"rejects literal expressions",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(8);
				const { templateEngine } = setupTemplateEngine();

				t.assert.throws(
					() => templateEngine.render("{{ true }}", {}),
					/literal/,
				);
				t.assert.throws(
					() => templateEngine.render("{{ false }}", {}),
					/literal/,
				);
				t.assert.throws(
					() => templateEngine.render("{{ null }}", {}),
					/literal/,
				);
				t.assert.throws(
					() => templateEngine.render("{{ undefined }}", {}),
					/literal/,
				);
				t.assert.throws(
					() => templateEngine.render("{{ NaN }}", {}),
					/literal/,
				);
				t.assert.throws(
					() => templateEngine.render("{{ Infinity }}", {}),
					/literal/,
				);
				t.assert.throws(
					() => templateEngine.render('{{ "text" }}', {}),
					/Expected word token/,
				);
				t.assert.throws(
					() => templateEngine.render("{{ 123 }}", {}),
					/Unexpected character/,
				);
			},
		);

		it(
			"rejects array path traversal",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () =>
					templateEngine.render("{{ todos.length }}", { todos: ["A"] });

				t.assert.throws(act, /Cannot access array value/);
			},
		);

		it(
			"rejects direct non-scalar rendering",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(3);
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
			},
		);

		it(
			"rejects variables in attribute-list position",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				t.assert.throws(
					() => templateEngine.render("<button{{ attrs }}>Save</button>", {}),
					/Variables in attribute-list position are not allowed/,
				);
			},
		);

		it(
			"rejects non-scalar values inside quoted attributes",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				t.assert.throws(
					() =>
						templateEngine.render('<div class="{{ value }}"></div>', {
							value: { className: "primary" },
						}),
					/Cannot render value in quoted attribute/,
				);
			},
		);
	});

	describe("collection length", () => {
		it(
			"renders empty and populated collection counts",
			{ tags: ["parr-derived", "parr-s7-r3"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template = "<p>{{ length(empty) }} / {{ length(todos) }}</p>";
				const context = {
					empty: [],
					todos: [{ title: "Plan" }, { title: "Ship" }],
				};

				const result = templateEngine.render(template, context);

				t.assert.deepStrictEqual<string>(result, "<p>0 / 2</p>");
			},
		);

		it(
			"counts nested and applied collection paths",
			{ tags: ["parr-derived", "parr-s7-r3"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template =
					"{{ length(page.todos) }}:{% apply groups %}<p>{{ length(attr.todos) }}</p>{% endapply %}";
				const context = {
					groups: [{ todos: ["Plan", "Ship"] }, { todos: [] }],
					page: { todos: ["Plan"] },
				};

				const result = templateEngine.render(template, context);

				t.assert.deepStrictEqual<string>(result, "1:<p>2</p><p>0</p>");
			},
		);

		it(
			"counts missing, null, and undefined collections as zero",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template =
					"{{ length(missing) }}/{{ length(unset) }}/{{ length(optional) }}";
				const context = { optional: undefined, unset: null };

				const result = templateEngine.render(template, context);

				t.assert.deepStrictEqual<string>(result, "0/0/0");
			},
		);

		it(
			"selects collection branches by whether the count is nonzero",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template =
					"{% if length(empty) %}Projects{% else %}No projects{% endif %}|{% if length(projects) %}Projects{% else %}No projects{% endif %}";
				const context = { empty: [], projects: [{ name: "Work" }] };

				const result = templateEngine.render(template, context);

				t.assert.deepStrictEqual<string>(result, "No projects|Projects");
			},
		);

		it(
			"keeps ordinary empty collection presence independent of its length",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template =
					"{% if projects %}Present{% endif %}:{% if length(projects) %}Populated{% else %}Empty{% endif %}";
				const context = { projects: [] };

				const result = templateEngine.render(template, context);

				t.assert.deepStrictEqual<string>(result, "Present:Empty");
			},
		);

		it(
			"reports the wrong collection field and view name",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("count.scream", "{{ length(user.name) }}");
				const context = { user: { name: "Ada" } };

				const act = () => templateEngine.renderView("count.scream", context);

				t.assert.throws(
					act,
					/length\(\) requires an array "length\(user\.name\)" in count\.scream/,
				);
			},
		);

		it(
			"rejects an object instead of silently counting it as one",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template = "{{ length(project) }}";
				const context = { project: { name: "Work" } };

				const act = () => templateEngine.render(template, context);

				t.assert.throws(act, /length\(\) requires an array/);
			},
		);

		it(
			"preserves ordinary fields named length",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template = "{{ length }} {{ box.length }} {{ length(items) }}";
				const context = { box: { length: 3 }, items: [], length: "Length" };

				const result = templateEngine.render(template, context);

				t.assert.deepStrictEqual<string>(result, "Length 3 0");
			},
		);

		it(
			"requires exactly one path argument without nested calls",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(4);
				const { templateEngine } = setupTemplateEngine();
				const context = { items: ["Plan"], other: [] };

				const empty = () => templateEngine.render("{{ length() }}", context);
				const multiple = () =>
					templateEngine.render("{{ length(items, other) }}", context);
				const nested = () =>
					templateEngine.render("{{ length(length(items)) }}", context);
				const literal = () =>
					templateEngine.render('{{ length("items") }}', context);

				t.assert.throws(empty, TemplateSyntaxError);
				t.assert.throws(multiple, TemplateSyntaxError);
				t.assert.throws(nested, TemplateSyntaxError);
				t.assert.throws(literal, TemplateSyntaxError);
			},
		);

		it(
			"does not introduce arithmetic, comparisons, or arbitrary calls",
			{
				tags: [
					"parr-derived",
					"parr-s7-r1",
					"parr-s7-r2",
					"parr-s7-r3",
					"parr-s7-r4",
				],
			},
			(t: TestContext) => {
				t.plan(3);
				const { templateEngine } = setupTemplateEngine();
				const context = { items: ["Plan"] };

				const arithmetic = () =>
					templateEngine.render("{{ length(items) + 1 }}", context);
				const comparison = () =>
					templateEngine.render(
						"{% if length(items) > 1 %}Many{% endif %}",
						context,
					);
				const arbitrary = () =>
					templateEngine.render("{{ count(items) }}", context);

				t.assert.throws(arithmetic, TemplateSyntaxError);
				t.assert.throws(comparison, TemplateSyntaxError);
				t.assert.throws(arbitrary, TemplateSyntaxError);
			},
		);

		it(
			"keeps application sources, parameters, and interfaces path-only",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(4);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("count.scream", "{{ count }}");
				const context = { items: ["Plan"] };

				const source = () =>
					templateEngine.render(
						"{% apply length(items) %}Item{% endapply %}",
						context,
					);
				const include = () =>
					templateEngine.render(
						'{% include "count.scream" with count: length(items) %}',
						context,
					);
				const parameter = () =>
					templateEngine.render(
						"{% template row %}{{ count }}{% endtemplate %}{% apply items to row(count: length(items)) %}",
						context,
					);
				const required = () =>
					templateEngine.render("{% interface length(items) %}", context);

				t.assert.throws(source, TemplateSyntaxError);
				t.assert.throws(include, TemplateSyntaxError);
				t.assert.throws(parameter, TemplateSyntaxError);
				t.assert.throws(required, TemplateSyntaxError);
			},
		);

		it(
			"renders counts in quoted non-URL attributes",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template = '<span data-count="{{ length(items) }}">Items</span>';
				const context = { items: ["Plan", "Ship"] };

				const result = templateEngine.render(template, context);

				t.assert.deepStrictEqual<string>(
					result,
					'<span data-count="2">Items</span>',
				);
			},
		);

		it(
			"does not treat collection counts as complete URLs",
			{ tags: ["parr-derived", "parr-s7-urls"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template = '<a href="{{ length(items) }}">Items</a>';
				const context = { items: ["Plan"] };

				const act = () => templateEngine.render(template, context);

				t.assert.throws(
					act,
					/URL attributes must use one complete attribute reference/,
				);
			},
		);

		it(
			"keeps count expressions out of script and style bodies",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(2);
				const { templateEngine } = setupTemplateEngine();
				const context = { items: ["Plan"] };

				const script = () =>
					templateEngine.render(
						"<script>{{ length(items) }}</script>",
						context,
					);
				const style = () =>
					templateEngine.render("<style>{{ length(items) }}</style>", context);

				t.assert.throws(
					script,
					/Variables are not allowed inside script or style tags/,
				);
				t.assert.throws(
					style,
					/Variables are not allowed inside script or style tags/,
				);
			},
		);
	});

	describe("presence conditionals", () => {
		it(
			"renders the primary branch when an attribute is present",
			{ tags: ["parr-direct", "parr-s8"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const result = templateEngine.render(
					"{% if title %}<h1>{{ title }}</h1>{% else %}<p>Untitled</p>{% endif %}",
					{ title: "Hello" },
				);

				t.assert.deepStrictEqual<string>(result, "<h1>Hello</h1>");
			},
		);

		it(
			"renders the alternate branch when an attribute is missing",
			{ tags: ["parr-direct", "parr-s8"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"treats false, zero, and empty string as present values",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const result = templateEngine.render(
					"{% if active %}A{% endif %}{% if count %}B{% endif %}{% if label %}C{% endif %}",
					{ active: false, count: 0, label: "" },
				);

				t.assert.deepStrictEqual<string>(result, "ABC");
			},
		);

		it(
			"rejects literal conditions",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"rejects array length conditions",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () =>
					templateEngine.render(
						"{% if todos.length %}A{% else %}B{% endif %}",
						{
							todos: ["A"],
						},
					);

				t.assert.throws(act, /Cannot access array value/);
			},
		);
	});

	describe("template interfaces", () => {
		it(
			"renders nothing when declared attributes are present",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const result = templateEngine.render(
					"{% interface title, user.name %}<h1>{{ title }}</h1>",
					{ title: "Home", user: { name: "Ada" } },
				);

				t.assert.deepStrictEqual<string>(result, "<h1>Home</h1>");
			},
		);

		it(
			"throws when declared attributes are missing",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(2);
				const { templateEngine } = setupTemplateEngine();

				t.assert.throws(
					() =>
						templateEngine.render(
							"{% interface title %}<h1>{{ title }}</h1>",
							{},
						),
					/Missing template attribute: title/,
				);
				t.assert.throws(
					() =>
						templateEngine.render(
							"{% interface user.name %}<h1>{{ user.name }}</h1>",
							{
								user: {},
							},
						),
					/Missing template attribute: user\.name/,
				);
			},
		);

		it(
			"checks included template interfaces against scoped parameters",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(2);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate(
					"title.scream",
					"{% interface title %}<h1>{{ title }}</h1>",
				);

				t.assert.deepStrictEqual<string>(
					templateEngine.render(
						'{% include "title.scream" with title: pageTitle %}',
						{
							pageTitle: "Home",
						},
					),
					"<h1>Home</h1>",
				);
				t.assert.throws(
					() => templateEngine.render('{% include "title.scream" %}', {}),
					/Missing template attribute: title/,
				);
			},
		);
	});

	describe("template application", () => {
		it(
			"applies an anonymous template to every item",
			{ tags: ["parr-direct", "parr-s8", "parr-s9-1"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"renders nothing when applying a missing attribute",
			{ tags: ["parr-derived", "parr-s6", "parr-s8"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const result = templateEngine.render(
					"Before{% apply users %}<li>{{ attr.name }}</li>{% endapply %}After",
					{},
				);

				t.assert.deepStrictEqual<string>(result, "BeforeAfter");
			},
		);

		it(
			"applies an anonymous template once to a single value",
			{ tags: ["parr-direct", "parr-s8", "parr-s9-1"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const result = templateEngine.render(
					"{% apply user %}<p>{{ attr.name }}</p>{% endapply %}",
					{ user: { name: "Ada" } },
				);

				t.assert.deepStrictEqual<string>(result, "<p>Ada</p>");
			},
		);

		it(
			"applies a named template to every item",
			{ tags: ["parr-direct", "parr-s8", "parr-s9-1"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"applies named templates round-robin",
			{ tags: ["parr-direct", "parr-s9-2"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"does not inherit the outer context inside applied templates",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"does not inherit the outer context inside file-backed applied templates",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"applies a file-backed template to every item",
			{ tags: ["parr-direct", "parr-s8", "parr-s9-1"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"applies file-backed templates round-robin",
			{ tags: ["parr-direct", "parr-s9-2"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"applies mixed named and file-backed templates round-robin",
			{ tags: ["parr-direct", "parr-s9-2"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate(
					"even-row.scream",
					'<li class="even">{{ attr.name }}</li>',
				);

				const result = templateEngine.render(
					'{% template odd %}<li class="odd">{{ attr.name }}</li>{% endtemplate %}<ul>{% apply users to odd, "even-row.scream" %}</ul>',
					{ users: [{ name: "Ada" }, { name: "Grace" }, { name: "Linus" }] },
				);

				t.assert.deepStrictEqual<string>(
					result,
					'<ul><li class="odd">Ada</li><li class="even">Grace</li><li class="odd">Linus</li></ul>',
				);
			},
		);

		it(
			"passes scoped parameters to named applied templates",
			{ tags: ["parr-direct", "parr-s8"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const result = templateEngine.render(
					"{% template row %}<li>{{ csrf }} {{ attr.name }} {{ pageTitle }}</li>{% endtemplate %}<ul>{% apply users to row(csrf: csrfToken) %}</ul>",
					{ csrfToken: "abc", pageTitle: "Users", users: [{ name: "Ada" }] },
				);

				t.assert.deepStrictEqual<string>(result, "<ul><li>abc Ada </li></ul>");
			},
		);

		it(
			"passes scoped parameters to file-backed applied templates",
			{ tags: ["parr-direct", "parr-s8"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate(
					"user-row.scream",
					"<li>{{ csrf }} {{ attr.name }} {{ pageTitle }}</li>",
				);

				const result = templateEngine.render(
					'{% apply users to "user-row.scream"(csrf: csrfToken) %}',
					{ csrfToken: "abc", pageTitle: "Users", users: [{ name: "Ada" }] },
				);

				t.assert.deepStrictEqual<string>(result, "<li>abc Ada </li>");
			},
		);

		it(
			"supports per-reference parameters in round-robin application",
			{ tags: ["parr-derived", "parr-s8", "parr-s9-2"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate(
					"even-row.scream",
					'<li class="{{ className }}">{{ attr.name }}</li>',
				);

				const result = templateEngine.render(
					'{% template odd %}<li class="{{ className }}">{{ attr.name }}</li>{% endtemplate %}<ul>{% apply users to odd(className: oddClass), "even-row.scream"(className: evenClass) %}</ul>',
					{
						evenClass: "even",
						oddClass: "odd",
						users: [{ name: "Ada" }, { name: "Grace" }, { name: "Linus" }],
					},
				);

				t.assert.deepStrictEqual<string>(
					result,
					'<ul><li class="odd">Ada</li><li class="even">Grace</li><li class="odd">Linus</li></ul>',
				);
			},
		);

		it(
			"supports per-reference parameters in named round-robin application",
			{ tags: ["parr-derived", "parr-s8", "parr-s9-2"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const result = templateEngine.render(
					'{% template odd %}<li class="{{ className }}">{{ attr.name }}</li>{% endtemplate %}{% template even %}<li class="{{ className }}">{{ attr.name }}</li>{% endtemplate %}<ul>{% apply users to odd(className: oddClass), even(className: evenClass) %}</ul>',
					{
						evenClass: "even",
						oddClass: "odd",
						users: [{ name: "Ada" }, { name: "Grace" }, { name: "Linus" }],
					},
				);

				t.assert.deepStrictEqual<string>(
					result,
					'<ul><li class="odd">Ada</li><li class="even">Grace</li><li class="odd">Linus</li></ul>',
				);
			},
		);

		it(
			"supports per-reference parameters in file-backed round-robin application",
			{ tags: ["parr-derived", "parr-s8", "parr-s9-2"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate(
					"odd-row.scream",
					'<li class="{{ className }}">{{ attr.name }}</li>',
				);
				fileLoader.setTemplate(
					"even-row.scream",
					'<li class="{{ className }}">{{ attr.name }}</li>',
				);

				const result = templateEngine.render(
					'{% apply users to "odd-row.scream"(className: oddClass), "even-row.scream"(className: evenClass) %}',
					{
						evenClass: "even",
						oddClass: "odd",
						users: [{ name: "Ada" }, { name: "Grace" }, { name: "Linus" }],
					},
				);

				t.assert.deepStrictEqual<string>(
					result,
					'<li class="odd">Ada</li><li class="even">Grace</li><li class="odd">Linus</li>',
				);
			},
		);

		it(
			"applies template stages left to right",
			{ tags: ["parr-direct", "parr-s9-1"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const result = templateEngine.render(
					"{% template bold %}<b>{{ attr }}</b>{% endtemplate %}{% template item %}<li>{{ attr }}</li>{% endtemplate %}<ul>{% apply names to bold then item %}</ul>",
					{ names: ["Ada", "<Grace>"] },
				);

				t.assert.deepStrictEqual<string>(
					result,
					"<ul><li><b>Ada</b></li><li><b>&lt;Grace&gt;</b></li></ul>",
				);
			},
		);

		it(
			"evaluates applied template parameters from the caller scope",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const result = templateEngine.render(
					"{% template child %}<li>{{ prefix }} {{ attr.name }}</li>{% endtemplate %}{% template parent %}<section>{{ attr.name }}<ul>{% apply attr.children to child(prefix: attr.name) %}</ul></section>{% endtemplate %}{% apply tree to parent %}",
					{
						tree: [
							{
								children: [{ name: "Ada" }],
								name: "Team",
							},
						],
					},
				);

				t.assert.deepStrictEqual<string>(
					result,
					"<section>Team<ul><li>Team Ada</li></ul></section>",
				);
			},
		);

		it(
			"renders missing applied template parameters as empty values",
			{ tags: ["parr-direct", "parr-s6"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const result = templateEngine.render(
					"{% template row %}<li>{{ missingValue }} {{ attr.name }}</li>{% endtemplate %}{% apply users to row(missingValue: missing.path) %}",
					{ users: [{ name: "Ada" }] },
				);

				t.assert.deepStrictEqual<string>(result, "<li> Ada</li>");
			},
		);

		it(
			"rejects invalid applied template parameters",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(7);
				const { templateEngine } = setupTemplateEngine();
				const expectedError =
					/Duplicate template parameter|Template parameter|Expected|Empty expression|Malformed path expression|Unexpected character/;

				t.assert.throws(
					() =>
						templateEngine.render(
							"{% apply users to row(csrf: token, csrf: otherToken) %}",
							{ users: [] },
						),
					expectedError,
				);
				t.assert.throws(
					() =>
						templateEngine.render("{% apply users to row(attr: item) %}", {
							users: [],
						}),
					expectedError,
				);
				t.assert.throws(
					() =>
						templateEngine.render("{% apply users to row() %}", { users: [] }),
					expectedError,
				);
				t.assert.throws(
					() =>
						templateEngine.render("{% apply users to row(csrf: token %}", {
							users: [],
						}),
					expectedError,
				);
				t.assert.throws(
					() =>
						templateEngine.render("{% apply users to row(csrf:) %}", {
							users: [],
						}),
					expectedError,
				);
				t.assert.throws(
					() =>
						templateEngine.render("{% apply users to row(csrf: token,) %}", {
							users: [],
						}),
					expectedError,
				);
				t.assert.throws(
					() =>
						templateEngine.render("{% apply users to row(user.name()) %}", {
							users: [],
						}),
					expectedError,
				);
			},
		);

		it(
			"renders file-backed applied templates containing includes and applications",
			{ tags: ["parr-derived", "parr-s8"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate(
					"user-row.scream",
					'<li>{% include "name.scream" with name: attr.name %}<ul>{% apply attr.tags %}<li>{{ attr }}</li>{% endapply %}</ul></li>',
				);
				fileLoader.setTemplate("name.scream", "{{ name }}");

				const result = templateEngine.render(
					'<ul>{% apply users to "user-row.scream" %}</ul>',
					{ users: [{ name: "Ada", tags: ["admin"] }] },
				);

				t.assert.deepStrictEqual<string>(
					result,
					"<ul><li>Ada<ul><li>admin</li></ul></li></ul>",
				);
			},
		);

		it(
			"allows named templates to apply themselves recursively",
			{ tags: ["parr-direct", "parr-s8", "parr-s9-3"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"renders hierarchical menus with presence-gated recursion",
			{ tags: ["parr-direct", "parr-s8", "parr-s9-3"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const result = templateEngine.render(
					'{% template menuItem %}<a href="{{ attr.url }}">{{ attr.title }}</a>{% if attr.showSubmenu %}<nav>{% apply attr.submenu to menuItem %}</nav>{% endif %}{% endtemplate %}{% apply choices to menuItem %}',
					{
						choices: [
							{
								showSubmenu: true,
								submenu: [
									{
										title: "Docs",
										url: "/docs",
									},
								],
								title: "Products",
								url: "/products",
							},
							{
								title: "About",
								url: "/about",
							},
						],
					},
				);

				t.assert.deepStrictEqual<string>(
					result,
					'<a href="/products">Products</a><nav><a href="/docs">Docs</a></nav><a href="/about">About</a>',
				);
			},
		);

		it(
			"throws for an unknown named template",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () =>
					templateEngine.render("{% apply users to row %}", { users: [] });

				t.assert.throws(act, /Unknown template: row/);
			},
		);

		it(
			"throws for an unknown named template with a missing source",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () => templateEngine.render("{% apply users to row %}", {});

				t.assert.throws(act, /Unknown template: row/);
			},
		);

		it(
			"throws for an unknown named template in an unselected branch",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () =>
					templateEngine.render(
						"{% if missing %}{% apply users to row %}{% endif %}",
						{},
					);

				t.assert.throws(act, /Unknown template: row/);
			},
		);

		it(
			"throws for duplicate named templates",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () =>
					templateEngine.render(
						"{% template row %}A{% endtemplate %}{% template row %}B{% endtemplate %}",
						{},
					);

				t.assert.throws(act, /Duplicate template: row/);
			},
		);

		it(
			"rejects empty apply template references",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () => templateEngine.render("{% apply users to %}", {});

				t.assert.throws(act, /Template reference required after to/);
			},
		);

		it(
			"rejects invalid file-backed applied template paths",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(5);
				const { templateEngine } = setupTemplateEngine();
				const expectedError =
					/Invalid template path|Applied templates must use the .scream extension/;

				t.assert.throws(
					() =>
						templateEngine.render('{% apply users to "/row.scream" %}', {
							users: [],
						}),
					expectedError,
				);
				t.assert.throws(
					() =>
						templateEngine.render('{% apply users to "./row.scream" %}', {
							users: [],
						}),
					expectedError,
				);
				t.assert.throws(
					() =>
						templateEngine.render('{% apply users to "../row.scream" %}', {
							users: [],
						}),
					expectedError,
				);
				t.assert.throws(
					() =>
						templateEngine.render(
							'{% apply users to "partials/../row.scream" %}',
							{ users: [] },
						),
					expectedError,
				);
				t.assert.throws(
					() =>
						templateEngine.render('{% apply users to "row.html" %}', {
							users: [],
						}),
					expectedError,
				);
			},
		);

		it(
			"rejects missing file-backed applied templates",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () =>
					templateEngine.render('{% apply users to "missing.scream" %}', {
						users: [],
					});

				t.assert.throws(act, /Template not found/);
			},
		);

		it(
			"rejects cycles across includes and file-backed applied templates",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"rejects extends and block directives inside file-backed applied templates",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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
						templateEngine.render(
							'{% apply users to "with-extends.scream" %}',
							{
								users: [],
							},
						),
					/Applied templates cannot contain extends directives/,
				);
				t.assert.throws(
					() =>
						templateEngine.render('{% apply users to "with-block.scream" %}', {
							users: [],
						}),
					/Applied templates cannot contain block directives/,
				);
			},
		);

		it(
			"rejects template definitions inside file-backed applied templates",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate(
					"with-template.scream",
					"{% template row %}X{% endtemplate %}",
				);

				t.assert.throws(
					() =>
						templateEngine.render(
							'{% apply users to "with-template.scream" %}',
							{
								users: [],
							},
						),
					/Applied templates cannot contain template definitions/,
				);
			},
		);
	});

	describe("removed syntax", () => {
		it(
			"rejects explicit for loops",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () =>
					templateEngine.render(
						"{% for item in items %}{{ item }}{% endfor %}",
						{
							items: ["A"],
						},
					);

				t.assert.throws(act, /Unsupported directive: for/);
			},
		);

		it(
			"rejects conditional attr directives",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"rejects custom logic directives",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () =>
					templateEngine.render("{% custom thing %}Nope{% endcustom %}", {});

				t.assert.throws(act, /Unknown directive/);
			},
		);
	});

	describe("model-view separation", () => {
		it(
			"rejects conditional branches that split HTML context",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(2);
				const { templateEngine } = setupTemplateEngine();

				t.assert.throws(
					() =>
						templateEngine.render(
							"{% if open %}<script>{% endif %}{{ payload }}{% if open %}</script>{% endif %}",
							{ open: true, payload: "x" },
						),
					/Template composition must preserve HTML context/,
				);
				t.assert.throws(
					() =>
						templateEngine.render(
							'{% if open %}<div class="{% endif %}{{ value }}{% if open %}">{% endif %}</div>',
							{ open: true, value: "x" },
						),
					/Template composition must preserve HTML context/,
				);
			},
		);

		it(
			"rejects applied templates that change HTML context",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(3);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("open-script.scream", "<script>");

				t.assert.throws(
					() =>
						templateEngine.render(
							"{% apply items %}<script>{% endapply %}{{ payload }}</script>",
							{ items: [true], payload: "x" },
						),
					/Template composition must preserve HTML context/,
				);
				t.assert.throws(
					() =>
						templateEngine.render(
							"{% template openScript %}<script>{% endtemplate %}{% apply items to openScript %}{{ payload }}</script>",
							{ items: [true], payload: "x" },
						),
					/Template composition must preserve HTML context/,
				);
				t.assert.throws(
					() =>
						templateEngine.render(
							'{% apply items to "open-script.scream" %}{{ payload }}</script>',
							{ items: [true], payload: "x" },
						),
					/Template composition must preserve HTML context/,
				);
			},
		);

		it(
			"rejects literal URL values in URL-bearing attributes",
			{ tags: ["parr-derived", "parr-s7-urls"] },
			(t: TestContext) => {
				t.plan(12);
				const { templateEngine } = setupTemplateEngine();
				const expectedError =
					/URL attributes must use one complete attribute reference/;

				t.assert.throws(
					() => templateEngine.render('<x action="/todos"></x>', {}),
					expectedError,
				);
				t.assert.throws(
					() => templateEngine.render('<x cite="/todos"></x>', {}),
					expectedError,
				);
				t.assert.throws(
					() => templateEngine.render('<x formaction="/todos"></x>', {}),
					expectedError,
				);
				t.assert.throws(
					() => templateEngine.render('<x href="/todos"></x>', {}),
					expectedError,
				);
				t.assert.throws(
					() => templateEngine.render('<x manifest="/todos"></x>', {}),
					expectedError,
				);
				t.assert.throws(
					() => templateEngine.render('<x poster="/todos"></x>', {}),
					expectedError,
				);
				t.assert.throws(
					() => templateEngine.render('<x src="/todos"></x>', {}),
					expectedError,
				);
				t.assert.throws(
					() => templateEngine.render('<x srcset="/todos"></x>', {}),
					expectedError,
				);

				t.assert.throws(
					() => templateEngine.render('<a href="todos">Todos</a>', {}),
					expectedError,
				);
				t.assert.throws(
					() =>
						templateEngine.render(
							'<a href="https://example.com">External</a>',
							{},
						),
					expectedError,
				);
				t.assert.throws(
					() =>
						templateEngine.render('<a href="//example.com">External</a>', {}),
					expectedError,
				);
				t.assert.throws(
					() => templateEngine.render('<a href="#content">Skip</a>', {}),
					expectedError,
				);
			},
		);

		it(
			"rejects literal URLs when attribute names span conditionals",
			{ tags: ["parr-derived", "parr-s7-urls"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template =
					'<a h{% if enabled %}ref{% endif %}="/hardcoded">X</a>';
				const context = Object.freeze({ enabled: true });

				const act = () => templateEngine.render(template, context);

				t.assert.throws(act, TemplateSyntaxError);
			},
		);

		it(
			"rejects route URLs composed from attributes and literal path fragments",
			{ tags: ["parr-derived", "parr-s7-urls"] },
			(t: TestContext) => {
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
					/Variables in unquoted attributes are not allowed/,
				);
			},
		);

		it(
			"rejects variables in unquoted attribute values",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(6);
				const { templateEngine } = setupTemplateEngine();

				t.assert.throws(
					() => templateEngine.render("<div class={{ value }}></div>", {}),
					/Variables in unquoted attributes are not allowed/,
				);
				t.assert.throws(
					() => templateEngine.render("<div class=item-{{ state }}></div>", {}),
					/Variables in unquoted attributes are not allowed/,
				);
				t.assert.throws(
					() => templateEngine.render("<a href={{ url }}>Link</a>", {}),
					/Variables in unquoted attributes are not allowed/,
				);
				t.assert.throws(
					() =>
						templateEngine.render("<button disabled {{ attrs }}></button>", {
							attrs: "class=primary",
						}),
					/Variables in attribute-list position are not allowed/,
				);
				t.assert.throws(
					() =>
						templateEngine.render(
							"<div class={% if enabled %}{{ value }}{% endif %}></div>",
							{ enabled: true, value: "a b" },
						),
					/Variables in unquoted attributes are not allowed/,
				);
				t.assert.throws(
					() =>
						templateEngine.render(
							"{% template value %}{{ attr }}{% endtemplate %}<div class={% apply items to value %}></div>",
							{ items: ["primary"] },
						),
					/Variables in unquoted attributes are not allowed/,
				);
			},
		);

		it(
			"allows quoted non-URL dynamic attributes with escaping",
			{ tags: ["parr-direct", "parr-s8-1"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const result = templateEngine.render(
					'<div class="{{ value }}"></div>',
					{
						value: 'one two&"<',
					},
				);

				t.assert.deepStrictEqual<string>(
					result,
					'<div class="one two&amp;&quot;&lt;"></div>',
				);
			},
		);

		it(
			"rejects variables inside script and style bodies",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(5);
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
				t.assert.throws(
					() =>
						templateEngine.render(
							"{% template value %}{{ attr }}{% endtemplate %}<script>{% apply items to value %}</script>",
							{ items: ["{}"] },
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
			},
		);

		it(
			"renders conditional literal attributes",
			{ tags: ["parr-direct", "parr-s8"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"allows URL attributes only when the value is one complete attribute reference",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(8);
				const { templateEngine } = setupTemplateEngine();
				const context = { urls: { todos: "/todos" } };

				t.assert.deepStrictEqual<string>(
					templateEngine.render('<x action="{{ urls.todos }}"></x>', context),
					'<x action="/todos"></x>',
				);
				t.assert.deepStrictEqual<string>(
					templateEngine.render('<x cite="{{ urls.todos }}"></x>', context),
					'<x cite="/todos"></x>',
				);
				t.assert.deepStrictEqual<string>(
					templateEngine.render(
						'<x formaction="{{ urls.todos }}"></x>',
						context,
					),
					'<x formaction="/todos"></x>',
				);
				t.assert.deepStrictEqual<string>(
					templateEngine.render('<x href="{{ urls.todos }}"></x>', context),
					'<x href="/todos"></x>',
				);
				t.assert.deepStrictEqual<string>(
					templateEngine.render('<x manifest="{{ urls.todos }}"></x>', context),
					'<x manifest="/todos"></x>',
				);
				t.assert.deepStrictEqual<string>(
					templateEngine.render('<x poster="{{ urls.todos }}"></x>', context),
					'<x poster="/todos"></x>',
				);
				t.assert.deepStrictEqual<string>(
					templateEngine.render('<x src="{{ urls.todos }}"></x>', context),
					'<x src="/todos"></x>',
				);
				t.assert.deepStrictEqual<string>(
					templateEngine.render('<x srcset="{{ urls.todos }}"></x>', context),
					'<x srcset="/todos"></x>',
				);
			},
		);

		it(
			"does not treat custom attributes ending in URL attribute names as URL-bearing",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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
			},
		);
	});

	describe("includes", () => {
		it(
			"preserves closing directive delimiters in double-quoted include names",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("part%}tail.scream", "<p>Included</p>");
				const template = '{% include "part%}tail.scream" %}';

				const result = templateEngine.render(template, {});

				t.assert.deepStrictEqual<string>(result, "<p>Included</p>");
			},
		);

		it(
			"preserves closing directive delimiters in single-quoted include names",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("part%}tail.scream", "<p>Included</p>");
				const template = "{% include 'part%}tail.scream' %}";

				const result = templateEngine.render(template, {});

				t.assert.deepStrictEqual<string>(result, "<p>Included</p>");
			},
		);

		it(
			"renders static includes",
			{ tags: ["parr-direct", "parr-s8"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("partial.scream", "<p>Static</p>");

				const result = templateEngine.render(
					'Before{% include "partial.scream" %}After',
					{ title: "Hello" },
				);

				t.assert.deepStrictEqual<string>(result, "Before<p>Static</p>After");
			},
		);

		it(
			"renders includes with scoped parameters",
			{ tags: ["parr-direct", "parr-s8"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"allows attr as a scoped include parameter name",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("card.scream", "{{ attr.name }}");

				const result = templateEngine.render(
					'{% include "card.scream" with attr: user %}',
					{ user: { name: "Ada" } },
				);

				t.assert.deepStrictEqual<string>(result, "Ada");
			},
		);

		it(
			"does not inherit outer context inside includes",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(2);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate(
					"card.scream",
					"{{ user.name }} {{ currentUser.name }}",
				);

				t.assert.deepStrictEqual<string>(
					templateEngine.render(
						'{% include "card.scream" with user: currentUser %}',
						{ currentUser: { name: "Ada" } },
					),
					"Ada ",
				);
				t.assert.deepStrictEqual<string>(
					templateEngine.render('{% include "card.scream" %}', {
						currentUser: { name: "Ada" },
					}),
					" ",
				);
			},
		);

		it(
			"rejects scoped include variables in unquoted attribute values",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("class-name.scream", "{{ value }}");

				const act = () =>
					templateEngine.render(
						'<div class={% include "class-name.scream" with value: className %}></div>',
						{ className: "active" },
					);

				t.assert.throws(
					act,
					/Variables in unquoted attributes are not allowed/,
				);
			},
		);

		it(
			"rejects duplicate scoped include parameters",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("partial.scream", "{{ label }}");

				const act = () =>
					templateEngine.render(
						'{% include "partial.scream" with label: first, label: second %}',
						{ first: "A", second: "B" },
					);

				t.assert.throws(act, /Duplicate template parameter: label/);
			},
		);

		it(
			"rejects invalid scoped include parameter expressions",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("partial.scream", "{{ label }}");

				const act = () =>
					templateEngine.render(
						'{% include "partial.scream" with label: user.name() %}',
						{ user: { name: "Ada" } },
					);

				t.assert.throws(act, /Malformed path expression|Unexpected character/);
			},
		);

		it(
			"renders missing scoped include parameters as absent",
			{ tags: ["parr-derived", "parr-s6", "parr-s8"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"resolves scoped include parameters from applied attr values",
			{ tags: ["parr-derived", "parr-s8"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("name.scream", "{{ label }}");

				const result = templateEngine.render(
					'{% apply users %}<p>{% include "name.scream" with label: attr.name %}</p>{% endapply %}',
					{ users: [{ name: "Ada" }] },
				);

				t.assert.deepStrictEqual<string>(result, "<p>Ada</p>");
			},
		);

		it(
			"rejects URL attributes composed from scoped include output",
			{ tags: ["parr-derived", "parr-s7-urls"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"renders nested includes",
			{ tags: ["parr-direct", "parr-s8"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate(
					"outer.scream",
					'<section>{% include "inner.scream" with title: title %}</section>',
				);
				fileLoader.setTemplate("inner.scream", "<p>{{ title }}</p>");

				const result = templateEngine.render(
					'{% include "outer.scream" with title: pageTitle %}',
					{
						pageTitle: "Nested",
					},
				);

				t.assert.deepStrictEqual<string>(
					result,
					"<section><p>Nested</p></section>",
				);
			},
		);

		it(
			"renders includes inside merged layout blocks",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate(
					"layout.scream",
					"<main>{% block content %}Default{% endblock content %}</main>",
				);
				fileLoader.setTemplate("partial.scream", "<p>{{ title }}</p>");
				fileLoader.setTemplate(
					"page.scream",
					'{% extends "layout.scream" %}{% block content %}{% include "partial.scream" with title: title %}{% endblock content %}',
				);

				const result = templateEngine.renderView("page.scream", {
					title: "Block",
				});

				t.assert.deepStrictEqual<string>(result, "<main><p>Block</p></main>");
			},
		);

		it(
			"renders includes containing apply nodes",
			{ tags: ["parr-derived", "parr-s8"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate(
					"rows.scream",
					"<ul>{% apply todos to row %}</ul>",
				);

				const result = templateEngine.render(
					'{% template row %}<li>{{ attr.title }}</li>{% endtemplate %}{% include "rows.scream" with todos: todos %}',
					{
						todos: [{ title: "Ship" }],
					},
				);

				t.assert.deepStrictEqual<string>(result, "<ul><li>Ship</li></ul>");
			},
		);

		it(
			"rejects invalid static include paths",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(5);
				const { templateEngine } = setupTemplateEngine();
				const expectedError =
					/Invalid include path|Included templates must use the .scream extension/;

				t.assert.throws(
					() => templateEngine.render('{% include "/partial.scream" %}', {}),
					expectedError,
				);
				t.assert.throws(
					() => templateEngine.render('{% include "./partial.scream" %}', {}),
					expectedError,
				);
				t.assert.throws(
					() => templateEngine.render('{% include "../partial.scream" %}', {}),
					expectedError,
				);
				t.assert.throws(
					() =>
						templateEngine.render(
							'{% include "partials/../partial.scream" %}',
							{},
						),
					expectedError,
				);
				t.assert.throws(
					() => templateEngine.render('{% include "partial.html" %}', {}),
					expectedError,
				);
			},
		);

		it(
			"rejects dynamic include names",
			{ tags: ["parr-derived", "parr-s7-r5"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () =>
					templateEngine.render("{% include partialName %}", {
						partialName: "partial.scream",
					});

				t.assert.throws(act, /Expected string token/);
			},
		);

		it(
			"rejects missing includes",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () =>
					templateEngine.render('{% include "missing.scream" %}', {});

				t.assert.throws(act, /Template not found/);
			},
		);

		it(
			"rejects include cycles",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("a.scream", '{% include "b.scream" %}');
				fileLoader.setTemplate("b.scream", '{% include "a.scream" %}');

				const act = () => templateEngine.render('{% include "a.scream" %}', {});

				t.assert.throws(
					act,
					/Cyclic template reference detected: a\.scream -> b\.scream -> a\.scream/,
				);
			},
		);

		it(
			"rejects extends and block directives inside included templates",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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
						templateEngine.render('{% include "with-extends.scream" %}', {}),
					/Included templates cannot contain extends directives/,
				);
				t.assert.throws(
					() => templateEngine.render('{% include "with-block.scream" %}', {}),
					/Included templates cannot contain block directives/,
				);
			},
		);

		it(
			"rejects template definitions inside included templates",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate(
					"with-template.scream",
					"{% template row %}X{% endtemplate %}",
				);

				t.assert.throws(
					() =>
						templateEngine.render('{% include "with-template.scream" %}', {}),
					/Included templates cannot contain template definitions/,
				);
			},
		);
	});

	describe("layouts", () => {
		it(
			"analyzes renderer placement after merging layout blocks",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(3);
				const fileLoader = new InMemoryFileLoader();
				const templateEngine = ScreamTemplateEngine.create(fileLoader);
				fileLoader.setTemplate(
					"attribute-layout.scream",
					'<div class="{% block content %}default{% endblock content %}"></div>',
				);
				fileLoader.setTemplate(
					"attribute-page.scream",
					'{% extends "attribute-layout.scream" %}{% block content %}{{ value }}{% endblock content %}',
				);
				fileLoader.setTemplate(
					"script-layout.scream",
					"<script>{% block content %}{% endblock content %}</script>",
				);
				fileLoader.setTemplate(
					"script-page.scream",
					'{% extends "script-layout.scream" %}{% block content %}{{ value }}{% endblock content %}',
				);

				t.assert.deepStrictEqual<string>(
					templateEngine.renderView("attribute-page.scream", {
						value: 'primary" required',
					}),
					'<div class="primary&quot; required"></div>',
				);
				t.assert.throws(
					() => templateEngine.renderView("script-page.scream", { value: "x" }),
					/Variables are not allowed inside script or style tags/,
				);
				t.assert.deepStrictEqual<string>(
					templateEngine.render('<div class="{{ value }}"></div>', {
						value: 'x" required',
					}),
					'<div class="x&quot; required"></div>',
				);
			},
		);

		it(
			"renders parent block fallback content",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate(
					"layout.scream",
					"<main>{% block content %}Default{% endblock content %}</main>",
				);
				fileLoader.setTemplate("page.scream", '{% extends "layout.scream" %}');

				const result = templateEngine.renderView("page.scream", {});

				t.assert.deepStrictEqual<string>(result, "<main>Default</main>");
			},
		);

		it(
			"renders apply nodes inside merged layout blocks",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"renders named templates inside merged layout blocks",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"rejects unknown child block overrides",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"rejects duplicate block definitions",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () =>
					templateEngine.render(
						"{% block content %}A{% endblock content %}{% block content %}B{% endblock content %}",
						{},
					);

				t.assert.throws(act, /Duplicate template block: content/);
			},
		);

		it(
			"rejects duplicate extends directives",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () =>
					templateEngine.render(
						'{% extends "a.scream" %}{% extends "b.scream" %}',
						{},
					);

				t.assert.throws(act, /at most one extends directive/);
			},
		);

		it(
			"rejects extends after meaningful content",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();

				const act = () =>
					templateEngine.render('Hello{% extends "layout.scream" %}', {});

				t.assert.throws(act, /Extends must be the first meaningful directive/);
			},
		);

		it(
			"rejects nested block overrides in extending templates",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"rejects layout cycles",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("a.scream", '{% extends "b.scream" %}');
				fileLoader.setTemplate("b.scream", '{% extends "a.scream" %}');

				const act = () => templateEngine.renderView("a.scream", {});

				t.assert.throws(act, /Cyclic extends detected/);
			},
		);

		it(
			"rejects extends inside template application",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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
			},
		);
	});

	describe("template groups", () => {
		it(
			"rejects empty template group lists",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);

				t.assert.throws(
					() => new TemplateGroupFileLoader({ groups: [] }),
					/Template groups must not be empty/,
				);
			},
		);

		it(
			"rejects invalid template group names",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(7);

				t.assert.throws(
					() => new TemplateGroupFileLoader({ groups: [""] }),
					/Invalid template group/,
				);
				t.assert.throws(
					() => new TemplateGroupFileLoader({ groups: ["/brand"] }),
					/Invalid template group/,
				);
				t.assert.throws(
					() => new TemplateGroupFileLoader({ groups: ["./brand"] }),
					/Invalid template group/,
				);
				t.assert.throws(
					() => new TemplateGroupFileLoader({ groups: ["../brand"] }),
					/Invalid template group/,
				);
				t.assert.throws(
					() => new TemplateGroupFileLoader({ groups: ["x/../brand"] }),
					/Invalid template group/,
				);
				t.assert.throws(
					() => new TemplateGroupFileLoader({ groups: ["C:\\brand"] }),
					/Invalid template group/,
				);
				t.assert.throws(
					() => new TemplateGroupFileLoader({ groups: ["brand\\tenant"] }),
					/Invalid template group/,
				);
			},
		);

		it(
			"loads views from the active group before fallback groups",
			{ tags: ["parr-direct", "parr-s9"] },
			(t: TestContext) => {
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
					'Brand {{ title }} {% include "shared.scream" with title: title %}',
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
			},
		);

		it(
			"falls back to later template groups when earlier groups are missing a view",
			{ tags: ["parr-direct", "parr-s9"] },
			(t: TestContext) => {
				t.plan(1);
				const viewsRoot = mkdtempSync(
					path.join(tmpdir(), "scream-template-groups-"),
				);
				t.after(() => {
					rmSync(viewsRoot, { force: true, recursive: true });
				});
				mkdirSync(path.join(viewsRoot, "default"), { recursive: true });
				mkdirSync(path.join(viewsRoot, "custom"), { recursive: true });
				writeFileSync(
					path.join(viewsRoot, "default", "page.scream"),
					"Default {{ title }}",
				);
				const templateEngine = ScreamTemplateEngine.create(
					new TemplateGroupFileLoader({
						groups: ["custom", "default"],
						viewsRoot,
					}),
				);

				const result = templateEngine.renderView("page.scream", {
					title: "Home",
				});

				t.assert.deepStrictEqual<string>(result, "Default Home");
			},
		);

		it(
			"reads grouped filesystem templates on every render",
			{ tags: ["parr-direct", "parr-s3", "parr-s9"] },
			(t: TestContext) => {
				t.plan(2);
				const viewsRoot = mkdtempSync(
					path.join(tmpdir(), "scream-template-groups-"),
				);
				t.after(() => {
					rmSync(viewsRoot, { force: true, recursive: true });
				});
				mkdirSync(path.join(viewsRoot, "default"), { recursive: true });
				const viewPath = path.join(viewsRoot, "default", "page.scream");
				writeFileSync(viewPath, "First {{ title }}");
				const templateEngine = ScreamTemplateEngine.create(
					new TemplateGroupFileLoader({
						groups: ["default"],
						viewsRoot,
					}),
				);

				t.assert.deepStrictEqual<string>(
					templateEngine.renderView("page.scream", { title: "Title" }),
					"First Title",
				);

				writeFileSync(viewPath, "Second {{ title }}");

				t.assert.deepStrictEqual<string>(
					templateEngine.renderView("page.scream", { title: "Title" }),
					"Second Title",
				);
			},
		);

		it(
			"loads valid nested view names from template groups",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(2);
				const viewsRoot = mkdtempSync(
					path.join(tmpdir(), "scream-template-groups-"),
				);
				t.after(() => {
					rmSync(viewsRoot, { force: true, recursive: true });
				});
				mkdirSync(path.join(viewsRoot, "default", "pages"), {
					recursive: true,
				});
				mkdirSync(path.join(viewsRoot, "default", "components"), {
					recursive: true,
				});
				writeFileSync(
					path.join(viewsRoot, "default", "pages", "index.scream"),
					'Page {% include "components/card.scream" with title: title %}',
				);
				writeFileSync(
					path.join(viewsRoot, "default", "components", "card.scream"),
					"Card {{ title }}",
				);
				const templateEngine = ScreamTemplateEngine.create(
					new TemplateGroupFileLoader({
						groups: ["default"],
						viewsRoot,
					}),
				);

				t.assert.deepStrictEqual<string>(
					templateEngine.renderView("pages/index.scream", { title: "Home" }),
					"Page Card Home",
				);
				t.assert.deepStrictEqual<string>(
					templateEngine.renderView("components/card.scream", {
						title: "Home",
					}),
					"Card Home",
				);
			},
		);

		it(
			"rejects invalid grouped view names",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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

				t.assert.throws(
					() => templateEngine.renderView("C:page.scream", {}),
					/Invalid view name/,
				);
				t.assert.throws(
					() => templateEngine.renderView("nested\\page.scream", {}),
					/Invalid view name/,
				);
				t.assert.throws(
					() => templateEngine.renderView("/page.scream", {}),
					/Invalid view name/,
				);
				t.assert.throws(
					() => templateEngine.renderView("./page.scream", {}),
					/Invalid view name/,
				);
				t.assert.throws(
					() => templateEngine.renderView("../page.scream", {}),
					/Invalid view name/,
				);
				t.assert.throws(
					() => templateEngine.renderView("nested/../page.scream", {}),
					/Invalid view name/,
				);
				t.assert.throws(
					() => templateEngine.renderView("page.html", {}),
					/Invalid view name/,
				);
			},
		);

		it(
			"fails loudly when a grouped view is missing from all groups",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
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
			},
		);

		it(
			"uses template groups for layout inheritance and file-backed apply templates",
			{ tags: ["parr-derived", "parr-s8", "parr-s9"] },
			(t: TestContext) => {
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

				t.assert.deepStrictEqual<string>(
					result,
					"<main><p>Brand Ada</p></main>",
				);
			},
		);
	});

	describe("views", () => {
		it(
			"reports a rendering error when a method reference is passed instead of a tag name",
			{ tags: ["parr-derived", "parr-s7-1", "parr-s8-1"] },
			(t: TestContext) => {
				t.plan(1);
				const templateEngine = ScreamTemplateEngine.create();
				const tagName = "  Work  ";
				const context = {
					tag: { name: tagName.trim },
					tagsUrl: "/tags",
				};

				const act = () => templateEngine.renderView("tag/show.scream", context);

				t.assert.throws(
					act,
					/Cannot render value "tag\.name" in tag[\\/]show\.scream/,
				);
			},
		);

		it(
			"renders a view by logical view name",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("home.scream", "Hello, {{ name }}!");

				const result = templateEngine.renderView("home.scream", {
					name: "John",
				});

				t.assert.deepStrictEqual<string>(result, "Hello, John!");
			},
		);

		it(
			"includes view names in syntax errors",
			{ tags: ["scream-policy"] },
			(t: TestContext) => {
				t.plan(1);
				const { fileLoader, templateEngine } = setupTemplateEngine();
				fileLoader.setTemplate("broken.scream", "{% for item in items %}");

				const act = () => templateEngine.renderView("broken.scream", {});

				t.assert.throws(act, /Unsupported directive: for.*in broken\.scream/);
			},
		);
	});
});
