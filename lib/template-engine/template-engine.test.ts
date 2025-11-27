import { beforeEach, describe, it, type TestContext } from "node:test";
import type { TemplateContext } from "./context.js";
import { Evaluator } from "./evaluator.js";
import { Generator } from "./generator.js";
import { InMemoryFileLoader } from "./in-memory-file-loader.js";
import { Parser } from "./parser.js";
import { Resolver } from "./resolver.js";
import { ScreamTemplateEngine } from "./template-engine.js";
import { Tokenizer } from "./tokenizer.js";
import { Transformer } from "./transformer.js";

describe("ScreamTemplateEngine", { concurrency: true }, () => {
	let templateEngine: ScreamTemplateEngine;
	let fileLoader: InMemoryFileLoader;
	let tokenizer: Tokenizer;
	let parser: Parser;
	let transformer: Transformer;
	let resolver: Resolver;
	let evaluator: Evaluator;
	let generator: Generator;

	beforeEach(() => {
		fileLoader = new InMemoryFileLoader();
		tokenizer = new Tokenizer();
		parser = new Parser();
		transformer = new Transformer();
		resolver = new Resolver(fileLoader, tokenizer, parser, transformer);
		evaluator = new Evaluator();
		generator = new Generator();
		templateEngine = new ScreamTemplateEngine(resolver, evaluator, generator);
	});

	describe("Variable replacement", () => {
		it("should replace a single variable", (t: TestContext) => {
			t.plan(1);

			const template = "Hello, {{ name }}!";
			const context: TemplateContext = { name: "John" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should replace an object key", (t: TestContext) => {
			t.plan(1);
			const template = "Hello, {{ user.name }}!";
			const context: TemplateContext = { user: { name: "John" } };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should replace a nested object key", (t: TestContext) => {
			t.plan(1);
			const template = "Hello, {{ dto.user.name }}!";
			const context: TemplateContext = { dto: { user: { name: "John" } } };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should replace multiple variables", (t: TestContext) => {
			t.plan(1);
			const template = "Hello, {{ name }}! Welcome to {{ place }}.";
			const context: TemplateContext = { name: "John", place: "Serbia" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(
				result,
				"Hello, John! Welcome to Serbia.",
			);
		});

		it("should replace missing variables with an empty string", (t: TestContext) => {
			t.plan(1);
			const template = "Hello, {{ name }}! Welcome to {{ place }}.";
			const context: TemplateContext = { name: "John" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, John! Welcome to .");
		});

		it("should return an empty string for an empty template", (t: TestContext) => {
			t.plan(1);
			const template = "";
			const context: TemplateContext = { name: "John" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "");
		});

		it("should ignore extra variables in the context", (t: TestContext) => {
			t.plan(1);
			const template = "Hello, {{ name }}!";
			const context: TemplateContext = { age: 30, name: "John" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should handle falsy values correctly", (t: TestContext) => {
			t.plan(1);
			const template = "Age: {{ age }}, Active: {{ active }}.";
			const context: TemplateContext = { active: false, age: 0 };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Age: 0, Active: false.");
		});

		it("should handle whitespace inside placeholders", (t: TestContext) => {
			t.plan(1);
			const template = "Hello, {{   name   }}!";
			const context: TemplateContext = { name: "John" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should replace duplicate placeholders", (t: TestContext) => {
			t.plan(1);
			const template = "{{ name }} {{ name }} {{ name }}";
			const context: TemplateContext = { name: "John" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "John John John");
		});

		it("should handle nested braces gracefully", (t: TestContext) => {
			t.plan(1);
			const template = "This is {{ notAVariable }} example.";
			const context: TemplateContext = { notAVariable: "{{nested}}" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "This is {{nested}} example.");
		});

		it("should handle empty variable names gracefully", (t: TestContext) => {
			t.plan(1);
			const template = "Hello, {{ }}!";
			const context: TemplateContext = { "": "" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, !");
		});

		it("should return the template unchanged if no variables exist", (t: TestContext) => {
			t.plan(1);
			const template = "Hello, world!";
			const context: TemplateContext = { name: "John" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, world!");
		});

		it("should replace non-primitive context values with an empty string", (t: TestContext) => {
			t.plan(1);
			const template =
				"Array: {{ array }}, Object: {{ obj }}, Function: {{ func }}.";
			const context: TemplateContext = {
				array: [1, 2],
				func: () => {},
				obj: { key: "value" },
			};

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(
				result,
				"Array: 1, 2, Object: , Function: .",
			);
		});

		it("should ignore malformed placeholders", (t: TestContext) => {
			t.plan(1);
			const template = "Hello, { name }} and {{ place }";
			const context: TemplateContext = { name: "John", place: "Serbia" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(
				result,
				"Hello, { name }} and {{ place }",
			);
		});

		it("should render empty string for non-serializable or symbolic values", (t: TestContext) => {
			t.plan(1);
			const template = "{{ magic }}";
			const context: TemplateContext = { magic: Symbol("test") };
			const result = templateEngine.compile(template, context);
			t.assert.deepStrictEqual<string>(result, "");
		});

		it("should render empty string if dot notation path hits non-object before reaching key", (t: TestContext) => {
			t.plan(1);
			const template = "{{ user.name.first }}";
			const context: TemplateContext = { user: { name: "John" } };
			const result = templateEngine.compile(template, context);
			t.assert.deepStrictEqual<string>(result, "");
		});
	});

	describe("Input escape", () => {
		it("should escape HTML special characters", (t: TestContext) => {
			t.plan(1);
			const template = "Hello, {{ name }}!";
			const context: TemplateContext = {
				name: "<script>alert('XSS')</script>",
			};

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(
				result,
				"Hello, &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;!",
			);
		});

		it("should not escape normal strings", (t: TestContext) => {
			t.plan(1);
			const template = "Hello, {{ name }}!";
			const context: TemplateContext = { name: "John" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should escape only valid variable replacements", (t: TestContext) => {
			t.plan(1);
			const template = "Hello, {{ name }} and {{ title }}!";
			const context: TemplateContext = { name: "<Admin>", title: undefined };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, &lt;Admin&gt; and !");
		});

		it("should escape all HTML special characters", (t: TestContext) => {
			t.plan(1);
			const template = "Input: {{ userInput }}";
			const context: TemplateContext = {
				userInput: '<div class="test">&</div>',
			};

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(
				result,
				"Input: &lt;div class=&quot;test&quot;&gt;&amp;&lt;/div&gt;",
			);
		});

		it("should escape single quotes", (t: TestContext) => {
			t.plan(1);
			const template = "Message: '{{ message }}'";
			const context: TemplateContext = { message: "O'Reilly's book" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(
				result,
				"Message: 'O&#39;Reilly&#39;s book'",
			);
		});

		it("should escape double quotes", (t: TestContext) => {
			t.plan(1);
			const template = "Attribute: {{ attribute }}";
			const context: TemplateContext = { attribute: '"test"' };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Attribute: &quot;test&quot;");
		});

		it("should escape ampersands", (t: TestContext) => {
			t.plan(1);
			const template = "Symbol: {{ symbol }}";
			const context: TemplateContext = { symbol: "&" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Symbol: &amp;");
		});

		it("should escape a combination of special characters", (t: TestContext) => {
			t.plan(1);
			const template = "{{ content }}";
			const context: TemplateContext = {
				content: "<script>alert('XSS & test');</script>",
			};

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(
				result,
				"&lt;script&gt;alert(&#39;XSS &amp; test&#39;);&lt;/script&gt;",
			);
		});

		it("should handle empty strings without escaping", (t: TestContext) => {
			t.plan(1);
			const template = "Value: {{ empty }}";
			const context: TemplateContext = { empty: "" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Value: ");
		});

		it("should not escape numbers", (t: TestContext) => {
			t.plan(1);
			const template = "Number: {{ number }}";
			const context: TemplateContext = { number: 12345 };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Number: 12345");
		});

		it("should not escape boolean values", (t: TestContext) => {
			t.plan(1);
			const template = "Boolean: {{ boolValue }}";
			const context: TemplateContext = { boolValue: true };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Boolean: true");
		});

		it("should not escape non-variable parts of the template", (t: TestContext) => {
			t.plan(1);
			const template = "Static content with <tags> and & symbols.";
			const context: TemplateContext = {};

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(
				result,
				"Static content with <tags> and & symbols.",
			);
		});

		it("should not re-escape already escaped input", (t: TestContext) => {
			t.plan(1);
			const template = "Value: {{ value }}";
			const context: TemplateContext = { value: "&lt;script&gt;" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Value: &lt;script&gt;");
		});
	});

	describe("Conditionals", () => {
		it("should handle simple conditionals", (t: TestContext) => {
			t.plan(1);
			const template = "{% if isLoggedIn %} Welcome, {{ name }}! {% endif %}";
			const context: TemplateContext = { isLoggedIn: true, name: "John" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Welcome, John!");
		});

		it("should handle conditionals with else", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% if isLoggedIn %} Welcome! {% else %} Please log in. {% endif %}";
			const context: TemplateContext = { isLoggedIn: false };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Please log in.");
		});

		it("should handle missing variables in conditionals", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% if isAdmin %} Admin Panel {% else %} User Panel {% endif %}";
			const context: TemplateContext = {};

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "User Panel");
		});

		it("should handle conditionals with content outside", (t: TestContext) => {
			t.plan(1);
			const template = "{% if name %}Name{% else %}{% endif %}After";
			const context: TemplateContext = { name: "John" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "NameAfter");
		});

		it("should handle conditionals with content outside", (t: TestContext) => {
			t.plan(1);
			const template =
				"Before{% if name %}Inside{% else %}Else{% endif %}After";
			const context: TemplateContext = { name: "John" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "BeforeInsideAfter");
		});

		it("should handle conditionals with content before and after", (t: TestContext) => {
			t.plan(1);
			const template =
				"Before{% if condition %}Inside{% else %}Else{% endif %}After";
			const context: TemplateContext = { condition: true };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "BeforeInsideAfter");
		});

		it("should handle nested conditionals", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% if condition1 %}Outer{% if condition2 %}Inner{% endif %}{% endif %}";
			const context: TemplateContext = { condition1: true, condition2: false };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Outer");
		});

		it("should handle deeply nested conditionals with alternate branches", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% if condition1 %}Outer{% if condition2 %}Inner{% else %}Fallback{% endif %}{% else %}Default{% endif %}";
			const context: TemplateContext = { condition1: true, condition2: false };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "OuterFallback");
		});

		it("should handle missing variables in nested conditionals", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% if condition1 %}Outer{% if condition2 %}Inner{% endif %}{% endif %}";
			const context: TemplateContext = {};

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "");
		});

		it("should handle multiple independent conditionals", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% if condition1 %}First{% endif %}Middle{% if condition2 %}Second{% endif %}";
			const context: TemplateContext = { condition1: true, condition2: false };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "FirstMiddle");
		});

		it("should treat 0 as falsy in conditionals", (t: TestContext) => {
			t.plan(1);
			const template = "{% if count %}Has count{% else %}No count{% endif %}";
			const context: TemplateContext = { count: 0 };
			const result = templateEngine.compile(template, context);
			t.assert.deepStrictEqual<string>(result, "No count");
		});

		it("should treat non-empty string as truthy in conditionals", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% if username %}Hi, {{ username }}{% else %}Guest{% endif %}";
			const context: TemplateContext = { username: "Alice" };
			const result = templateEngine.compile(template, context);
			t.assert.deepStrictEqual<string>(result, "Hi, Alice");
		});

		it("should treat empty string as falsy in conditionals", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% if empty %}Has value{% else %}Empty string{% endif %}";
			const context: TemplateContext = { empty: "" };
			const result = templateEngine.compile(template, context);
			t.assert.deepStrictEqual<string>(result, "Empty string");
		});

		describe("Conditionals - dot notation in if conditions", () => {
			it("should evaluate truthy dot notation expressions correctly", (t: TestContext) => {
				t.plan(1);
				const template =
					"{% if items.length %}Items exist{% else %}No items{% endif %}";
				const context: TemplateContext = { items: [{ id: 1 }, { id: 2 }] };

				const result = templateEngine.compile(template, context);

				t.assert.deepStrictEqual<string>(result, "Items exist");
			});

			it("should evaluate falsy dot notation expressions correctly when array is empty", (t: TestContext) => {
				t.plan(1);
				const template =
					"{% if items.length %}Items exist{% else %}No items{% endif %}";
				const context: TemplateContext = { items: [] };

				const result = templateEngine.compile(template, context);

				t.assert.deepStrictEqual<string>(result, "No items");
			});

			it("should evaluate falsy dot notation expressions correctly when property is missing", (t: TestContext) => {
				t.plan(1);
				const template =
					"{% if items.length %}Items exist{% else %}No items{% endif %}";
				const context: TemplateContext = {};

				const result = templateEngine.compile(template, context);

				t.assert.deepStrictEqual<string>(result, "No items");
			});

			it("should evaluate truthy deeply nested dot notation expressions", (t: TestContext) => {
				t.plan(1);
				const template =
					"{% if user.profile.name %}Hello{% else %}No name{% endif %}";
				const context: TemplateContext = {
					user: { profile: { name: "Alice" } },
				};

				const result = templateEngine.compile(template, context);

				t.assert.deepStrictEqual<string>(result, "Hello");
			});

			it("should evaluate falsy deeply nested dot notation expressions when inner property is missing", (t: TestContext) => {
				t.plan(1);
				const template =
					"{% if user.profile.name %}Hello{% else %}No name{% endif %}";
				const context: TemplateContext = { user: { profile: {} } };

				const result = templateEngine.compile(template, context);

				t.assert.deepStrictEqual<string>(result, "No name");
			});

			it("should evaluate falsy dot notation expressions when intermediate value is not an object", (t: TestContext) => {
				t.plan(1);
				const template =
					"{% if user.profile.name %}Hello{% else %}No name{% endif %}";
				const context: TemplateContext = { user: { profile: null } };

				const result = templateEngine.compile(template, context);

				t.assert.deepStrictEqual<string>(result, "No name");
			});

			it("should evaluate falsy dot notation expressions when top-level key is not an object", (t: TestContext) => {
				t.plan(1);
				const template =
					"{% if user.profile.name %}Hello{% else %}No name{% endif %}";
				const context: TemplateContext = { user: "notAnObject" };

				const result = templateEngine.compile(template, context);

				t.assert.deepStrictEqual<string>(result, "No name");
			});
		});

		it("should handle interleaved text, conditionals, and loops", (t: TestContext) => {
			t.plan(1);
			const template =
				"A {% if x %} B {% for y in ys %} C {% endfor %} D {% endif %} E";
			const context: TemplateContext = { x: true, ys: ["item"] };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "A B  C  D E");
		});
	});

	describe("Iterations", () => {
		it("should iterate over a simple array", (t: TestContext) => {
			t.plan(1);
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const context: TemplateContext = { letters: ["A", "B", "C"] };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, " A  B  C ");
		});

		it("should render nothing for an empty array", (t: TestContext) => {
			t.plan(1);
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const context: TemplateContext = { letters: [] };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "");
		});

		it("should support nested loops", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% for user in users %}{% for task in user.tasks %}{{ user.name }}-{{ task }};{% endfor %}{% endfor %}";
			const context: TemplateContext = {
				users: [
					{ name: "Alice", tasks: ["t1", "t2"] },
					{ name: "Bob", tasks: ["t3"] },
				],
			};

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "Alice-t1;Alice-t2;Bob-t3;");
		});

		it("should render nothing for non-array collections", (t: TestContext) => {
			t.plan(1);
			const template = "{% for item in items %} {{ item }} {% endfor %}";
			const context: TemplateContext = { items: "not an array" };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "");
		});

		it.todo("should shadow parent context variables in for loop");

		it("should render nothing when the collection variable is missing", (t: TestContext) => {
			t.plan(1);
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const context: TemplateContext = {};

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "");
		});

		it("should allow iterator shadowing without leaking outer values", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% for item in outer %}[{% for item in inner %}{{ item }}, {% endfor %}|{{ item }}]{% endfor %}";
			const context: TemplateContext = {
				inner: ["i1", "i2"],
				outer: ["o1", "o2"],
			};

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "[i1, i2, |o1][i1, i2, |o2]");
		});

		it("should preserve existing context after loops complete", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% for item in items %}{{ item }}{% endfor %}{{ item }}";
			const context: TemplateContext = { item: "outer", items: ["X", "Y"] };

			const result = templateEngine.compile(template, context);

			t.assert.deepStrictEqual<string>(result, "XYouter");
		});

		it("should support dot notation in collection reference", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% for item in user.items %}{{ item.name }} {% endfor %}";
			const context: TemplateContext = {
				user: { items: [{ name: "A" }, { name: "B" }] },
			};
			const result = templateEngine.compile(template, context);
			t.assert.deepStrictEqual<string>(result, "A B ");
		});

		it("should render nothing if dot-notated collection is undefined", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% for item in user.items %}{{ item.name }} {% endfor %}";
			const context: TemplateContext = {};
			const result = templateEngine.compile(template, context);
			t.assert.deepStrictEqual<string>(result, "");
		});

		it("should handle collections with null or undefined values", (t: TestContext) => {
			t.plan(2);
			const template = "{% for item in items %}{{ item }} {% endfor %}";

			const contextWithNull: TemplateContext = { items: null };
			const contextWithUndefined: TemplateContext = {};

			const resultNull = templateEngine.compile(template, contextWithNull);
			const resultUndefined = templateEngine.compile(
				template,
				contextWithUndefined,
			);

			t.assert.deepStrictEqual<string>(resultNull, "");
			t.assert.deepStrictEqual<string>(resultUndefined, "");
		});

		it("should iterate over a collection of objects and use dot notation", (t: TestContext) => {
			t.plan(1);
			const template = "{% for item in items %}{{ item.name }} {% endfor %}";
			const context: TemplateContext = {
				items: [{ name: "Alpha" }, { name: "Beta" }, { name: "Gamma" }],
			};

			const result = templateEngine.compile(template, context);
			t.assert.deepStrictEqual<string>(result, "Alpha Beta Gamma ");
		});

		it("should iterate over a collection and handle nested properties", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% for item in items %}{{ item.meta.name }} {% endfor %}";
			const context: TemplateContext = {
				items: [
					{ meta: { name: "X" } },
					{ meta: { name: "Y" } },
					{ meta: { name: "Z" } },
				],
			};

			const result = templateEngine.compile(template, context);
			t.assert.deepStrictEqual<string>(result, "X Y Z ");
		});

		it("should not leak iterator variable outside the for loop", (t: TestContext) => {
			t.plan(1);
			const template =
				"{% for item in items %}{{ item }} {% endfor %}{{ item }}";
			const context: TemplateContext = { items: ["One"] };

			const result = templateEngine.compile(template, context);
			t.assert.deepStrictEqual<string>(result, "One ");
		});
	});

	describe("Layouts", () => {
		beforeEach(() => {
			fileLoader.setTemplate(
				"layout.html",
				"<header>{% block header %}Default Header{% endblock header %}</header><main>{% block content %}Default Content{% endblock content %}</main><footer>{% block footer %}Default Footer{% endblock footer %}</footer>",
			);
		});

		it("should render all overridden blocks correctly", (t: TestContext) => {
			t.plan(1);
			const childTemplate = `{% extends "layout.html" %}
			{% block header %}Custom Header{% endblock header %}
			{% block content %}Custom Content{% endblock content %}
			{% block footer %}Custom Footer{% endblock footer %}`;

			const result = templateEngine.compile(childTemplate, {});
			t.assert.deepStrictEqual<string>(
				result,
				"<header>Custom Header</header><main>Custom Content</main><footer>Custom Footer</footer>",
			);
		});

		it("should preserve default blocks if only some are overridden", (t: TestContext) => {
			t.plan(1);
			const childTemplate = `{% extends "layout.html" %}
			{% block content %}Only Content Changed{% endblock content %}`;

			const result = templateEngine.compile(childTemplate, {});
			t.assert.deepStrictEqual<string>(
				result,
				"<header>Default Header</header><main>Only Content Changed</main><footer>Default Footer</footer>",
			);
		});

		it("should preserve unknown blocks in the layout", (t: TestContext) => {
			t.plan(1);
			const layoutWithExtraBlock =
				"<main>{% block content %}Default Content{% endblock content %}</main>{% block sidebar %}Default Sidebar{% endblock sidebar %}";

			fileLoader.setTemplate("layout.html", layoutWithExtraBlock);

			const childTemplate = `{% extends "layout.html" %}
			{% block content %}Main Page{% endblock content %}`;

			const result = templateEngine.compile(childTemplate, {});
			t.assert.deepStrictEqual<string>(
				result,
				"<main>Main Page</main>Default Sidebar",
			);
		});

		it("should support nested layouts and override hierarchy", (t: TestContext) => {
			t.plan(1);
			fileLoader.setTemplate(
				"base.html",
				`<header>{% block header %}Base Header{% endblock header %}</header><main>{% block content %}Base Content{% endblock content %}</main><footer>{% block footer %}Base Footer{% endblock footer %}</footer>`,
			);

			fileLoader.setTemplate(
				"parent.html",
				`{% extends "base.html" %}{% block header %}Parent Header{% endblock header %}{% block content %}Parent Content{% endblock content %}`,
			);

			const childTemplate = `{% extends "parent.html" %}{% block content %}Child Content{% endblock content %}`;

			const result = templateEngine.compile(childTemplate, {});

			t.assert.deepStrictEqual<string>(
				result,
				"<header>Parent Header</header><main>Child Content</main><footer>Base Footer</footer>",
			);
		});

		it("should support 4-level nested layout inheritance", (t: TestContext) => {
			t.plan(1);
			fileLoader.setTemplate(
				"base.html",
				"<main>{% block content %}Base{% endblock content %}</main>",
			);
			fileLoader.setTemplate(
				"level1.html",
				`{% extends "base.html" %}{% block content %}Level1{% endblock content %}`,
			);
			fileLoader.setTemplate(
				"level2.html",
				`{% extends "level1.html" %}{% block content %}Level2{% endblock content %}`,
			);
			const childTemplate = `{% extends "level2.html" %}{% block content %}Level3{% endblock content %}`;

			const result = templateEngine.compile(childTemplate, {});
			t.assert.deepStrictEqual<string>(result, "<main>Level3</main>");
		});

		it("should combine parent and child block overrides correctly", (t: TestContext) => {
			t.plan(1);
			fileLoader.setTemplate(
				"base.html",
				`<header>{% block header %}Base Header{% endblock header %}</header><main>{% block content %}Base Content{% endblock content %}</main>`,
			);
			fileLoader.setTemplate(
				"parent.html",
				`{% extends "base.html" %}{% block header %}Parent Header{% endblock header %}`,
			);
			const childTemplate = `{% extends "parent.html" %}{% block content %}Child Content{% endblock content %}`;

			const result = templateEngine.compile(childTemplate, {});
			t.assert.deepStrictEqual<string>(
				result,
				"<header>Parent Header</header><main>Child Content</main>",
			);
		});

		it("should combine parent and child block overrides correctly with compile()", (t: TestContext) => {
			t.plan(1);
			fileLoader.setTemplate(
				"base.html",
				`<header>{% block header %}Base Header{% endblock header %}</header><main>{% block content %}Base Content{% endblock content %}</main>`,
			);

			fileLoader.setTemplate(
				"parent.html",
				`{% extends "base.html" %}{% block header %}Parent Header{% endblock header %}`,
			);

			const childTemplate = `{% extends "parent.html" %}{% block content %}Child Content{% endblock content %}`;

			const result = templateEngine.compile(childTemplate, {});

			t.assert.deepStrictEqual<string>(
				result,
				"<header>Parent Header</header><main>Child Content</main>",
			);
		});

		it("should throw on cyclic layout extends", (t: TestContext) => {
			t.plan(1);
			fileLoader.setTemplate(
				"a.html",
				`{% extends "b.html" %}{% block content %}A{% endblock %}`,
			);
			fileLoader.setTemplate(
				"b.html",
				`{% extends "a.html" %}{% block content %}B{% endblock %}`,
			);

			t.assert.throws(
				() =>
					templateEngine.compile(
						`{% extends "a.html" %}{% block content %}Root{% endblock %}`,
						{},
					),
				/ cyclic extends /i,
			);
		});
	});
});
