import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { ScreamTemplateEngine } from "./template-engine.js";

describe("ScreamTemplateEngine", () => {
	let templateEngine: ScreamTemplateEngine;

	beforeEach(() => {
		templateEngine = new ScreamTemplateEngine();
	});

	describe("Variable replacement", () => {
		it("should replace a single variable", () => {
			const template = "Hello, {{ name }}!";
			const context = { name: "John" };

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

		it("should handle undefined variables gracefully", () => {
			const template = "Value: {{ missing }}";
			const context = {};

			const result = templateEngine.compile(template, context);

			assert.deepStrictEqual(result, "Value: ");
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
	});
});
