import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
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
		it("should replace a single variable", () => {
			const template = "Hello, {{ name }}!";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should replace an object key", () => {
			const template = "Hello, {{ user.name }}!";
			const context = { user: { name: "John" } };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should replace a nested object key", () => {
			const template = "Hello, {{ dto.user.name }}!";
			const context = { dto: { user: { name: "John" } } };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should replace multiple variables", () => {
			const template = "Hello, {{ name }}! Welcome to {{ place }}.";
			const context = { name: "John", place: "Serbia" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Hello, John! Welcome to Serbia.");
		});

		it("should replace missing variables with an empty string", () => {
			const template = "Hello, {{ name }}! Welcome to {{ place }}.";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Hello, John! Welcome to .");
		});

		it("should return an empty string for an empty template", () => {
			const template = "";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "");
		});

		it("should ignore extra variables in the context", () => {
			const template = "Hello, {{ name }}!";
			const context = { age: 30, name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should handle falsy values correctly", () => {
			const template = "Age: {{ age }}, Active: {{ active }}.";
			const context = { active: false, age: 0 };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Age: 0, Active: false.");
		});

		it("should handle whitespace inside placeholders", () => {
			const template = "Hello, {{   name   }}!";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should replace duplicate placeholders", () => {
			const template = "{{ name }} {{ name }} {{ name }}";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "John John John");
		});

		it("should handle nested braces gracefully", () => {
			const template = "This is {{ notAVariable }} example.";
			const context = { notAVariable: "{{nested}}" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "This is {{nested}} example.");
		});

		it("should handle empty variable names gracefully", () => {
			const template = "Hello, {{ }}!";
			const context = { "": "" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Hello, !");
		});

		it("should return the template unchanged if no variables exist", () => {
			const template = "Hello, world!";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Hello, world!");
		});

		it("should replace non-primitive context values with an empty string", () => {
			const template =
				"Array: {{ array }}, Object: {{ obj }}, Function: {{ func }}.";
			const context = { array: [1, 2], func: () => {}, obj: { key: "value" } };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(
				result,
				"Array: 1, 2, Object: , Function: .",
			);
		});

		it("should ignore malformed placeholders", () => {
			const template = "Hello, { name }} and {{ place }";
			const context = { name: "John", place: "Serbia" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Hello, { name }} and {{ place }");
		});

		it("should render empty string for non-serializable or symbolic values", () => {
			const template = "{{ magic }}";
			const context = { magic: Symbol("test") };
			const result = templateEngine.compile(template, context);
			assert.deepStrictEqual<string>(result, "");
		});

		it("should render empty string if dot notation path hits non-object before reaching key", () => {
			const template = "{{ user.name.first }}";
			const context = { user: { name: "John" } };
			const result = templateEngine.compile(template, context);
			assert.deepStrictEqual<string>(result, "");
		});
	});

	describe("Form helpers", () => {
		it("should expose encodeInputName to templates", () => {
			const template = `<input type="text" name="{{ encodeInputName('todo.title') }}" value="{{ todo.title }}">`;
			const context = {
				todo: { title: "Buy milk" },
			};

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(
				result,
				'<input type="text" name="todo[title]" value="Buy milk">',
			);
		});

		it("should encode nested paths via encodeInputName", () => {
			const template = `<input name="{{ encodeInputName('todo.owner.address.street') }}" value="{{ todo.owner.address.street }}">`;
			const context = {
				todo: { owner: { address: { street: "Elm" } } },
			};

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(
				result,
				'<input name="todo[owner][address][street]" value="Elm">',
			);
		});

		it("should reuse encodeInputName multiple times", () => {
			const template =
				'<input name="{{ encodeInputName(\'todo.title\') }}" value="{{ todo.title }}"><input name="{{ encodeInputName(\'todo.description\') }}" value="{{ todo.description }}"> ';
			const context = { todo: { description: "text", title: "Buy milk" } };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(
				result,
				'<input name="todo[title]" value="Buy milk"><input name="todo[description]" value="text"> ',
			);
		});
	});

	describe("Input escape", () => {
		it("should escape HTML special characters", () => {
			const template = "Hello, {{ name }}!";
			const context = { name: "<script>alert('XSS')</script>" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(
				result,
				"Hello, &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;!",
			);
		});

		it("should not escape normal strings", () => {
			const template = "Hello, {{ name }}!";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should escape only valid variable replacements", () => {
			const template = "Hello, {{ name }} and {{ title }}!";
			const context = { name: "<Admin>", title: undefined };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Hello, &lt;Admin&gt; and !");
		});

		it("should escape all HTML special characters", () => {
			const template = "Input: {{ userInput }}";
			const context = { userInput: '<div class="test">&</div>' };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(
				result,
				"Input: &lt;div class=&quot;test&quot;&gt;&amp;&lt;/div&gt;",
			);
		});

		it("should escape single quotes", () => {
			const template = "Message: '{{ message }}'";
			const context = { message: "O'Reilly's book" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(
				result,
				"Message: 'O&#39;Reilly&#39;s book'",
			);
		});

		it("should escape double quotes", () => {
			const template = "Attribute: {{ attribute }}";
			const context = { attribute: '"test"' };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Attribute: &quot;test&quot;");
		});

		it("should escape ampersands", () => {
			const template = "Symbol: {{ symbol }}";
			const context = { symbol: "&" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Symbol: &amp;");
		});

		it("should escape a combination of special characters", () => {
			const template = "{{ content }}";
			const context = { content: "<script>alert('XSS & test');</script>" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(
				result,
				"&lt;script&gt;alert(&#39;XSS &amp; test&#39;);&lt;/script&gt;",
			);
		});

		it("should handle empty strings without escaping", () => {
			const template = "Value: {{ empty }}";
			const context = { empty: "" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Value: ");
		});

		it("should not escape numbers", () => {
			const template = "Number: {{ number }}";
			const context = { number: 12345 };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Number: 12345");
		});

		it("should not escape boolean values", () => {
			const template = "Boolean: {{ boolValue }}";
			const context = { boolValue: true };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Boolean: true");
		});

		it("should not escape non-variable parts of the template", () => {
			const template = "Static content with <tags> and & symbols.";
			const context = {};

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(
				result,
				"Static content with <tags> and & symbols.",
			);
		});

		it("should not re-escape already escaped input", () => {
			const template = "Value: {{ value }}";
			const context = { value: "&lt;script&gt;" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Value: &lt;script&gt;");
		});
	});

	describe("Conditionals", () => {
		it("should handle simple conditionals", () => {
			const template = "{% if isLoggedIn %} Welcome, {{ name }}! {% endif %}";
			const context = { isLoggedIn: true, name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Welcome, John!");
		});

		it("should handle conditionals with else", () => {
			const template =
				"{% if isLoggedIn %} Welcome! {% else %} Please log in. {% endif %}";
			const context = { isLoggedIn: false };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Please log in.");
		});

		it("should handle missing variables in conditionals", () => {
			const template =
				"{% if isAdmin %} Admin Panel {% else %} User Panel {% endif %}";
			const context = {};

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "User Panel");
		});

		it("should handle conditionals with content outside", () => {
			const template = "{% if name %}Name{% else %}{% endif %}After";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "NameAfter");
		});

		it("should handle conditionals with content outside", () => {
			const template =
				"Before{% if name %}Inside{% else %}Else{% endif %}After";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "BeforeInsideAfter");
		});

		it("should handle conditionals with content before and after", () => {
			const template =
				"Before{% if condition %}Inside{% else %}Else{% endif %}After";
			const context = { condition: true };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "BeforeInsideAfter");
		});

		it("should handle nested conditionals", () => {
			const template =
				"{% if condition1 %}Outer{% if condition2 %}Inner{% endif %}{% endif %}";
			const context = { condition1: true, condition2: false };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "Outer");
		});

		it("should handle deeply nested conditionals with alternate branches", () => {
			const template =
				"{% if condition1 %}Outer{% if condition2 %}Inner{% else %}Fallback{% endif %}{% else %}Default{% endif %}";
			const context = { condition1: true, condition2: false };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "OuterFallback");
		});

		it("should handle missing variables in nested conditionals", () => {
			const template =
				"{% if condition1 %}Outer{% if condition2 %}Inner{% endif %}{% endif %}";
			const context = {};

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "");
		});

		it("should handle multiple independent conditionals", () => {
			const template =
				"{% if condition1 %}First{% endif %}Middle{% if condition2 %}Second{% endif %}";
			const context = { condition1: true, condition2: false };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "FirstMiddle");
		});

		it("should treat 0 as falsy in conditionals", () => {
			const template = "{% if count %}Has count{% else %}No count{% endif %}";
			const context = { count: 0 };
			const result = templateEngine.compile(template, context);
			assert.deepStrictEqual<string>(result, "No count");
		});

		it("should treat non-empty string as truthy in conditionals", () => {
			const template =
				"{% if username %}Hi, {{ username }}{% else %}Guest{% endif %}";
			const context = { username: "Alice" };
			const result = templateEngine.compile(template, context);
			assert.deepStrictEqual<string>(result, "Hi, Alice");
		});

		it("should treat empty string as falsy in conditionals", () => {
			const template =
				"{% if empty %}Has value{% else %}Empty string{% endif %}";
			const context = { empty: "" };
			const result = templateEngine.compile(template, context);
			assert.deepStrictEqual<string>(result, "Empty string");
		});

		describe("Conditionals - dot notation in if conditions", () => {
			it("should evaluate truthy dot notation expressions correctly", () => {
				const template =
					"{% if items.length %}Items exist{% else %}No items{% endif %}";
				const context = { items: [{ id: 1 }, { id: 2 }] };

				const result = templateEngine.compile(template, context);

				assert.deepStrictEqual<string>(result, "Items exist");
			});

			it("should evaluate falsy dot notation expressions correctly when array is empty", () => {
				const template =
					"{% if items.length %}Items exist{% else %}No items{% endif %}";
				const context = { items: [] };

				const result = templateEngine.compile(template, context);

				assert.deepStrictEqual<string>(result, "No items");
			});

			it("should evaluate falsy dot notation expressions correctly when property is missing", () => {
				const template =
					"{% if items.length %}Items exist{% else %}No items{% endif %}";
				const context = {};

				const result = templateEngine.compile(template, context);

				assert.deepStrictEqual<string>(result, "No items");
			});

			it("should evaluate truthy deeply nested dot notation expressions", () => {
				const template =
					"{% if user.profile.name %}Hello{% else %}No name{% endif %}";
				const context = { user: { profile: { name: "Alice" } } };

				const result = templateEngine.compile(template, context);

				assert.deepStrictEqual<string>(result, "Hello");
			});

			it("should evaluate falsy deeply nested dot notation expressions when inner property is missing", () => {
				const template =
					"{% if user.profile.name %}Hello{% else %}No name{% endif %}";
				const context = { user: { profile: {} } };

				const result = templateEngine.compile(template, context);

				assert.deepStrictEqual<string>(result, "No name");
			});

			it("should evaluate falsy dot notation expressions when intermediate value is not an object", () => {
				const template =
					"{% if user.profile.name %}Hello{% else %}No name{% endif %}";
				const context = { user: { profile: null } };

				const result = templateEngine.compile(template, context);

				assert.deepStrictEqual<string>(result, "No name");
			});

			it("should evaluate falsy dot notation expressions when top-level key is not an object", () => {
				const template =
					"{% if user.profile.name %}Hello{% else %}No name{% endif %}";
				const context = { user: "notAnObject" };

				const result = templateEngine.compile(template, context);

				assert.deepStrictEqual<string>(result, "No name");
			});
		});
	});

	describe("Iterations", () => {
		it("should iterate over a simple array", () => {
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const context = { letters: ["A", "B", "C"] };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, " A  B  C ");
		});

		it("should render nothing for an empty array", () => {
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const context = { letters: [] };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "");
		});

		it("should support nested loops");

		it("should render nothing for non-array collections", () => {
			const template = "{% for item in items %} {{ item }} {% endfor %}";
			const context = { items: "not an array" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "");
		});

		it.todo("should shadow parent context variables in for loop");

		it("should render nothing when the collection variable is missing", () => {
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const context = {};

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual<string>(result, "");
		});

		it("should support dot notation in collection reference", () => {
			const template =
				"{% for item in user.items %}{{ item.name }} {% endfor %}";
			const context = { user: { items: [{ name: "A" }, { name: "B" }] } };
			const result = templateEngine.compile(template, context);
			assert.deepStrictEqual<string>(result.trim(), "A B");
		});

		it("should render nothing if dot-notated collection is undefined", () => {
			const template =
				"{% for item in user.items %}{{ item.name }} {% endfor %}";
			const context = {};
			const result = templateEngine.compile(template, context);
			assert.deepStrictEqual<string>(result, "");
		});

		it("should handle collections with null or undefined values", () => {
			const template = "{% for item in items %}{{ item }} {% endfor %}";

			const contextWithNull = { items: null };
			const contextWithUndefined = {};

			const resultNull = templateEngine.compile(template, contextWithNull);
			const resultUndefined = templateEngine.compile(
				template,
				contextWithUndefined,
			);

			assert.deepStrictEqual<string>(resultNull, "");
			assert.deepStrictEqual<string>(resultUndefined, "");
		});

		it("should iterate over a collection of objects and use dot notation", () => {
			const template = "{% for item in items %}{{ item.name }} {% endfor %}";
			const context = {
				items: [{ name: "Alpha" }, { name: "Beta" }, { name: "Gamma" }],
			};

			const result = templateEngine.compile(template, context);
			assert.deepStrictEqual<string>(result.trim(), "Alpha Beta Gamma");
		});

		it("should iterate over a collection and handle nested properties", () => {
			const template =
				"{% for item in items %}{{ item.meta.name }} {% endfor %}";
			const context = {
				items: [
					{ meta: { name: "X" } },
					{ meta: { name: "Y" } },
					{ meta: { name: "Z" } },
				],
			};

			const result = templateEngine.compile(template, context);
			assert.deepStrictEqual<string>(result.trim(), "X Y Z");
		});

		it("should not leak iterator variable outside the for loop", () => {
			const template =
				"{% for item in items %}{{ item }} {% endfor %}{{ item }}";
			const context = { items: ["One"] };

			const result = templateEngine.compile(template, context);
			assert.deepStrictEqual<string>(result.trim(), "One");
		});
	});

	describe("Layouts", () => {
		beforeEach(() => {
			fileLoader.setTemplate(
				"layout.html",
				"<header>{% block header %}Default Header{% endblock header %}</header><main>{% block content %}Default Content{% endblock content %}</main><footer>{% block footer %}Default Footer{% endblock footer %}</footer>",
			);
		});

		it("should render all overridden blocks correctly", () => {
			const childTemplate = `{% extends "layout.html" %}
			{% block header %}Custom Header{% endblock header %}
			{% block content %}Custom Content{% endblock content %}
			{% block footer %}Custom Footer{% endblock footer %}`;

			const result = templateEngine.compile(childTemplate, {});
			assert.deepStrictEqual<string>(
				result,
				"<header>Custom Header</header><main>Custom Content</main><footer>Custom Footer</footer>",
			);
		});

		it("should preserve default blocks if only some are overridden", () => {
			const childTemplate = `{% extends "layout.html" %}
			{% block content %}Only Content Changed{% endblock content %}`;

			const result = templateEngine.compile(childTemplate, {});
			assert.deepStrictEqual<string>(
				result,
				"<header>Default Header</header><main>Only Content Changed</main><footer>Default Footer</footer>",
			);
		});

		it("should preserve unknown blocks in the layout", () => {
			const layoutWithExtraBlock =
				"<main>{% block content %}Default Content{% endblock content %}</main>{% block sidebar %}Default Sidebar{% endblock sidebar %}";

			fileLoader.setTemplate("layout.html", layoutWithExtraBlock);

			const childTemplate = `{% extends "layout.html" %}
			{% block content %}Main Page{% endblock content %}`;

			const result = templateEngine.compile(childTemplate, {});
			assert.deepStrictEqual<string>(
				result,
				"<main>Main Page</main>Default Sidebar",
			);
		});

		it("should support nested layouts and override hierarchy", () => {
			fileLoader.setTemplate(
				"base.html",
				`
				<header>{% block header %}Base Header{% endblock header %}</header>
				<main>{% block content %}Base Content{% endblock content %}</main>
				<footer>{% block footer %}Base Footer{% endblock footer %}</footer>
    			`,
			);

			fileLoader.setTemplate(
				"parent.html",
				`{% extends "base.html" %}
				{% block header %}Parent Header{% endblock header %}
				{% block content %}Parent Content{% endblock content %}`,
			);

			const childTemplate = `{% extends "parent.html" %}{% block content %}Child Content{% endblock content %}`;

			const result = templateEngine.compile(childTemplate, {});

			assert.deepStrictEqual<string>(
				result.trim().replace(/\s+/g, " "),
				"<header>Parent Header</header> <main>Child Content</main> <footer>Base Footer</footer>",
			);
		});

		it("should support 4-level nested layout inheritance", () => {
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
			assert.deepStrictEqual<string>(result.trim(), "<main>Level3</main>");
		});

		it("should combine parent and child block overrides correctly", () => {
			fileLoader.setTemplate(
				"base.html",
				`
    <header>{% block header %}Base Header{% endblock header %}</header>
    <main>{% block content %}Base Content{% endblock content %}</main>
  `,
			);
			fileLoader.setTemplate(
				"parent.html",
				`{% extends "base.html" %}{% block header %}Parent Header{% endblock header %}`,
			);
			const childTemplate = `{% extends "parent.html" %}{% block content %}Child Content{% endblock content %}`;

			const result = templateEngine.compile(childTemplate, {});
			assert.deepStrictEqual<string>(
				result.trim().replace(/\s+/g, " "),
				"<header>Parent Header</header> <main>Child Content</main>",
			);
		});

		it("should combine parent and child block overrides correctly with compile()", () => {
			fileLoader.setTemplate(
				"base.html",
				`
<header>{% block header %}Base Header{% endblock header %}</header>
<main>{% block content %}Base Content{% endblock content %}</main>
`,
			);

			fileLoader.setTemplate(
				"parent.html",
				`{% extends "base.html" %}{% block header %}Parent Header{% endblock header %}`,
			);

			const childTemplate = `{% extends "parent.html" %}{% block content %}Child Content{% endblock content %}`;

			const result = templateEngine.compile(childTemplate, {});

			assert.deepStrictEqual<string>(
				result.trim().replace(/\s+/g, " "),
				"<header>Parent Header</header> <main>Child Content</main>",
			);
		});

		it("should throw on cyclic layout extends", () => {
			fileLoader.setTemplate(
				"a.html",
				`{% extends "b.html" %}{% block content %}A{% endblock %}`,
			);
			fileLoader.setTemplate(
				"b.html",
				`{% extends "a.html" %}{% block content %}B{% endblock %}`,
			);

			assert.throws(
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
