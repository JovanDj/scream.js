import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Generator } from "./generator.js";
import { InMemoryFileLoader } from "./in-memory-file-loader.js";
import { Parser } from "./parser.js";
import { ScreamTemplateEngine } from "./template-engine.js";
import { Tokenizer } from "./tokenizer.js";
import { Transformer } from "./transformer.js";

describe("ScreamTemplateEngine", { concurrency: true }, () => {
	let templateEngine: ScreamTemplateEngine;
	let fileLoader: InMemoryFileLoader;
	let tokenizer: Tokenizer;
	let parser: Parser;
	let transformer: Transformer;
	let generator: Generator;

	beforeEach(() => {
		fileLoader = new InMemoryFileLoader();
		tokenizer = new Tokenizer();
		parser = new Parser();
		transformer = new Transformer();
		generator = new Generator();
		templateEngine = new ScreamTemplateEngine(
			fileLoader,
			tokenizer,
			parser,
			transformer,
			generator,
		);
	});

	describe("Variable replacement", () => {
		it("should replace a single variable", () => {
			const template = "Hello, {{ name }}!";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Hello, John!");
		});

		it("should replace an object key", () => {
			const template = "Hello, {{ user.name }}!";
			const context = { user: { name: "John" } };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Hello, John!");
		});

		it("should replace a nested object key", () => {
			const template = "Hello, {{ dto.user.name }}!";
			const context = { dto: { user: { name: "John" } } };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Hello, John!");
		});

		it("should replace multiple variables", () => {
			const template = "Hello, {{ name }}! Welcome to {{ place }}.";
			const context = { name: "John", place: "Serbia" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Hello, John! Welcome to Serbia.");
		});

		it("should replace missing variables with an empty string", () => {
			const template = "Hello, {{ name }}! Welcome to {{ place }}.";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Hello, John! Welcome to .");
		});

		it("should return an empty string for an empty template", () => {
			const template = "";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "");
		});

		it("should ignore extra variables in the context", () => {
			const template = "Hello, {{ name }}!";
			const context = { age: 30, name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Hello, John!");
		});

		it("should handle falsy values correctly", () => {
			const template = "Age: {{ age }}, Active: {{ active }}.";
			const context = { active: false, age: 0 };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Age: 0, Active: false.");
		});

		it("should handle whitespace inside placeholders", () => {
			const template = "Hello, {{   name   }}!";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Hello, John!");
		});

		it("should replace duplicate placeholders", () => {
			const template = "{{ name }} {{ name }} {{ name }}";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "John John John");
		});

		it("should handle nested braces gracefully", () => {
			const template = "This is {{ notAVariable }} example.";
			const context = { notAVariable: "{{nested}}" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "This is {{nested}} example.");
		});

		it("should handle empty variable names gracefully", () => {
			const template = "Hello, {{ }}!";
			const context = { "": "Anonymous" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Hello, !");
		});

		it("should return the template unchanged if no variables exist", () => {
			const template = "Hello, world!";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Hello, world!");
		});

		it("should replace non-primitive context values with an empty string", () => {
			const template =
				"Array: {{ array }}, Object: {{ obj }}, Function: {{ func }}.";
			const context = { array: [1, 2], func: () => {}, obj: { key: "value" } };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Array: , Object: , Function: .");
		});

		it("should ignore malformed placeholders", () => {
			const template = "Hello, { name }} and {{ place }";
			const context = { name: "John", place: "Serbia" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Hello, { name }} and {{ place }");
		});
	});

	describe("Input escape", () => {
		it("should escape HTML special characters", () => {
			const template = "Hello, {{ name }}!";
			const context = { name: "<script>alert('XSS')</script>" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(
				result,
				"Hello, &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;!",
			);
		});

		it("should not escape normal strings", () => {
			const template = "Hello, {{ name }}!";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Hello, John!");
		});

		it("should escape only valid variable replacements", () => {
			const template = "Hello, {{ name }} and {{ title }}!";
			const context = { name: "<Admin>", title: undefined };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Hello, &lt;Admin&gt; and !");
		});

		it("should escape all HTML special characters", () => {
			const template = "Input: {{ userInput }}";
			const context = { userInput: '<div class="test">&</div>' };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(
				result,
				"Input: &lt;div class=&quot;test&quot;&gt;&amp;&lt;/div&gt;",
			);
		});

		it("should escape single quotes", () => {
			const template = "Message: '{{ message }}'";
			const context = { message: "O'Reilly's book" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Message: 'O&#39;Reilly&#39;s book'");
		});

		it("should escape double quotes", () => {
			const template = "Attribute: {{ attribute }}";
			const context = { attribute: '"test"' };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Attribute: &quot;test&quot;");
		});

		it("should escape ampersands", () => {
			const template = "Symbol: {{ symbol }}";
			const context = { symbol: "&" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Symbol: &amp;");
		});

		it("should escape a combination of special characters", () => {
			const template = "{{ content }}";
			const context = { content: "<script>alert('XSS & test');</script>" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(
				result,
				"&lt;script&gt;alert(&#39;XSS &amp; test&#39;);&lt;/script&gt;",
			);
		});

		it("should handle empty strings without escaping", () => {
			const template = "Value: {{ empty }}";
			const context = { empty: "" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Value: ");
		});

		it("should not escape numbers", () => {
			const template = "Number: {{ number }}";
			const context = { number: 12345 };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Number: 12345");
		});

		it("should not escape boolean values", () => {
			const template = "Boolean: {{ boolValue }}";
			const context = { boolValue: true };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Boolean: true");
		});

		it("should not escape non-variable parts of the template", () => {
			const template = "Static content with <tags> and & symbols.";
			const context = {};

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(
				result,
				"Static content with <tags> and & symbols.",
			);
		});

		it("should not re-escape already escaped input", () => {
			const template = "Value: {{ value }}";
			const context = { value: "&lt;script&gt;" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Value: &lt;script&gt;");
		});
	});

	describe("Conditionals", () => {
		it("should handle simple conditionals", () => {
			const template = "{% if isLoggedIn %} Welcome, {{ name }}! {% endif %}";
			const context = { isLoggedIn: true, name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Welcome, John!");
		});

		it("should handle conditionals with else", () => {
			const template =
				"{% if isLoggedIn %} Welcome! {% else %} Please log in. {% endif %}";
			const context = { isLoggedIn: false };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Please log in.");
		});

		it("should handle missing variables in conditionals", () => {
			const template =
				"{% if isAdmin %} Admin Panel {% else %} User Panel {% endif %}";
			const context = {};

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "User Panel");
		});

		it("should handle conditionals with content outside", () => {
			const template = "{% if name %}Name{% else %}{% endif %}After";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "NameAfter");
		});

		it("should handle conditionals with content outside", () => {
			const template =
				"Before{% if name %}Inside{% else %}Else{% endif %}After";
			const context = { name: "John" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "BeforeInsideAfter");
		});

		it("should handle conditionals with content before and after", () => {
			const template =
				"Before{% if condition %}Inside{% else %}Else{% endif %}After";
			const context = { condition: true };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "BeforeInsideAfter");
		});

		it("should handle nested conditionals", () => {
			const template =
				"{% if condition1 %}Outer{% if condition2 %}Inner{% endif %}{% endif %}";
			const context = { condition1: true, condition2: false };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Outer");
		});

		it("should handle deeply nested conditionals with alternate branches", () => {
			const template =
				"{% if condition1 %}Outer{% if condition2 %}Inner{% else %}Fallback{% endif %}{% else %}Default{% endif %}";
			const context = { condition1: true, condition2: false };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "OuterFallback");
		});

		it("should handle missing variables in nested conditionals", () => {
			const template =
				"{% if condition1 %}Outer{% if condition2 %}Inner{% endif %}{% endif %}";
			const context = {};

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "");
		});

		it("should handle multiple independent conditionals", () => {
			const template =
				"{% if condition1 %}First{% endif %}Middle{% if condition2 %}Second{% endif %}";
			const context = { condition1: true, condition2: false };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "FirstMiddle");
		});
	});

	describe("Iterations", () => {
		it("should iterate over a simple array", () => {
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const context = { letters: ["A", "B", "C"] };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, " A  B  C ");
		});

		it("should render nothing for an empty array", () => {
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const context = { letters: [] };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "");
		});

		it("should support nested loops");

		it("should render nothing for non-array collections", () => {
			const template = "{% for item in items %} {{ item }} {% endfor %}";
			const context = { items: "not an array" };

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "");
		});

		it.todo("should shadow parent context variables in for loop");

		it("should render nothing when the collection variable is missing", () => {
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const context = {}; // 'letters' not defined

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "");
		});

		it.todo("should handle collections with null or undefined values");

		it.todo("should iterate over a collection of objects and use dot notation");

		it.todo("should iterate over a collection and handle nested properties");

		it.todo("should not leak iterator variable outside the for loop");
	});

	describe("Layouts", () => {
		beforeEach(() => {
			fileLoader.setTemplate(
				"layout.html",
				"<main>{% block content %}Default Content{% endblock content %}</main>",
			);
		});

		it("should render default block content when no overrides are provided", () => {
			const childTemplate = `{% extends "layout.html" %}`;

			const result = templateEngine.compile(childTemplate, {});

			assert.deepStrictEqual(result, "<main>Default Content</main>");
		});

		it("should render mixed content with default block and overridden block", () => {
			fileLoader.setTemplate(
				"layout.html",
				"<header>Default Header</header><main>{% block content %}Default Content{% endblock content %}</main>",
			);

			const childTemplate = `{% extends "layout.html" %}{% block content %}Overridden Content{% endblock content %}`;

			const result = templateEngine.compile(childTemplate, {});

			assert.deepStrictEqual(
				result,
				"<header>Default Header</header><main>Overridden Content</main>",
			);
		});
	});
});
