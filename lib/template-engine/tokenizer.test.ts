import { describe, it, type TestContext } from "node:test";

import { type Token, Tokenizer } from "./tokenizer.js";

describe("Tokenizer", { concurrency: true }, () => {
	const setupTokenizer = () => {
		const tokenizer = new Tokenizer();
		const tokenize = (input: string) => {
			return tokenizer.tokenize(input, "test-template");
		};

		return { templateName: "test-template", tokenize, tokenizer };
	};

	describe("Variable replacement", () => {
		it("should tokenize a single variable", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{{ name }}";
			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable" },
				{ name: "name", type: "identifier" },
			]);
		});

		it("should throw on empty variable", (t: TestContext) => {
			t.plan(1);
			const { tokenizer, templateName } = setupTokenizer();
			const template = "{{}}";

			t.assert.throws(() => tokenizer.tokenize(template, templateName), {
				column: 1,
				line: 1,
				message: "Variable expression cannot be empty",
				name: "TokenizerError",
				snippet: "{{}}",
				templateName,
			});
		});

		it("should throw on empty variable with trailing text", (t: TestContext) => {
			t.plan(1);
			const { tokenizer, templateName } = setupTokenizer();
			const template = "{{}}}";

			t.assert.throws(() => tokenizer.tokenize(template, templateName), {
				column: 1,
				line: 1,
				message: "Variable expression cannot be empty",
				name: "TokenizerError",
				snippet: "{{}}}",
				templateName,
			});
		});

		it("should tokenize multiple variables", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{{ firstName }} {{ lastName }}";
			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable" },
				{ name: "firstName", type: "identifier" },
				{ type: "text", value: " " },
				{ type: "variable" },
				{ name: "lastName", type: "identifier" },
			]);
		});

		it("should tokenize variables with surrounding text", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "Hello, {{ name }}!";
			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "text", value: "Hello, " },
				{ type: "variable" },
				{ name: "name", type: "identifier" },
				{ type: "text", value: "!" },
			]);
		});

		it("should tokenize nested variables with dot notation", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "Welcome {{ user.profile.name }}!";
			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "text", value: "Welcome " },
				{ type: "variable" },
				{ name: "user", type: "identifier" },
				{ type: "dot" },
				{ name: "profile", type: "identifier" },
				{ type: "dot" },
				{ name: "name", type: "identifier" },
				{ type: "text", value: "!" },
			]);
		});

		it("should tokenize variables with bracket notation and strings", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{{ user['first-name'] }}";
			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable" },
				{ name: "user", type: "identifier" },
				{ type: "string", value: "first-name" },
			]);
		});

		it("should tokenize deeply nested variables", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{{ a.b.c.d }}";
			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable" },
				{ name: "a", type: "identifier" },
				{ type: "dot" },
				{ name: "b", type: "identifier" },
				{ type: "dot" },
				{ name: "c", type: "identifier" },
				{ type: "dot" },
				{ name: "d", type: "identifier" },
			]);
		});

		it("should tokenize variables with numbers", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{{ items[12] }}";
			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable" },
				{ name: "items", type: "identifier" },
				{ type: "number", value: 12 },
			]);
		});
	});

	describe("Conditionals", () => {
		it("should tokenize simple conditionals", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% if isLoggedIn %} Welcome! {% endif %}";
			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ condition: "isLoggedIn", type: "if" },
				{ type: "text", value: " Welcome! " },
				{ type: "endif" },
			]);
		});

		it("should tokenize conditionals with else", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template =
				"{% if isLoggedIn %} Welcome! {% else %} Please log in. {% endif %}";
			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ condition: "isLoggedIn", type: "if" },
				{ type: "text", value: " Welcome! " },
				{ type: "else" },
				{ type: "text", value: " Please log in. " },
				{ type: "endif" },
			]);
		});
	});

	describe("Iterations", () => {
		it("should tokenize a simple for loop", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ collection: "letters", iterator: "letter", type: "for" },
				{ type: "text", value: " " },
				{ type: "variable" },
				{ name: "letter", type: "identifier" },
				{ type: "text", value: " " },
				{ type: "endfor" },
			]);
		});

		it("should tokenize nested for loops", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template =
				"{% for user in users %} {% for task in user.tasks %} {{ task.title }} {% endfor %} {% endfor %}";
			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ collection: "users", iterator: "user", type: "for" },
				{ type: "text", value: " " },
				{ collection: "user.tasks", iterator: "task", type: "for" },
				{ type: "text", value: " " },
				{ type: "variable" },
				{ name: "task", type: "identifier" },
				{ type: "dot" },
				{ name: "title", type: "identifier" },
				{ type: "text", value: " " },
				{ type: "endfor" },
				{ type: "text", value: " " },
				{ type: "endfor" },
			]);
		});

		it("should handle an empty loop gracefully", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% for item in emptyArray %}{% endfor %}";
			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ collection: "emptyArray", iterator: "item", type: "for" },
				{ type: "endfor" },
			]);
		});
	});

	describe("Layouts", () => {
		it("should tokenize layouts ", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = `{% extends "layout" %}`;

			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ template: ' "layout" ', type: "extends" },
			]);
		});

		it("should tokenize layouts with single quotes", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = `{% extends 'layout' %}`;
			const tokens = tokenize(template);
			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ template: " 'layout' ", type: "extends" },
			]);
		});

		it("should tokenize unquoted extends target as raw text", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = `{% extends layout %}`;

			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ template: " layout ", type: "extends" },
			]);
		});

		it("should tokenize a named block", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% block content %}Hello{% endblock %}";
			const tokens = tokenize(template);
			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ name: "content", type: "block" },
				{ type: "text", value: "Hello" },
				{ type: "endblock" },
			]);
		});

		it("should tokenize an endblock with an optional name", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% block content %}Hello{% endblock content %}";
			const tokens = tokenize(template);
			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ name: "content", type: "block" },
				{ type: "text", value: "Hello" },
				{ type: "endblock" },
			]);
		});
	});

	describe("Edge Cases & Errors", () => {
		it("should throw on unclosed for block", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% for item in items";
			t.assert.throws(() => tokenize(template), /Unclosed {% for %}/);
		});

		it("should include template name and 1-based location in tokenizer errors", (t: TestContext) => {
			t.plan(1);
			const { tokenizer } = setupTokenizer();
			t.assert.throws(
				() => tokenizer.tokenize("Hello {{ name", "greeting.njk"),
				{
					column: 7,
					line: 1,
					name: "TokenizerError",
					templateName: "greeting.njk",
				},
			);
		});

		it("should compute positions correctly across CRLF newlines", (t: TestContext) => {
			t.plan(1);
			const { tokenizer } = setupTokenizer();
			const template = "first line\r\nsecond {{ name";
			t.assert.throws(() => tokenizer.tokenize(template, "crlf.njk"), {
				column: 8,
				line: 2,
				name: "TokenizerError",
				snippet: "second {{ name",
			});
		});

		it("should throw on malformed for tag (missing 'in')", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% for item items %}";
			t.assert.throws(() => tokenize(template), /Invalid syntax in {% for %}/);
		});

		it("should throw on malformed for tag (missing iterator)", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% for in items %}";
			t.assert.throws(
				() => tokenize(template),
				/Invalid syntax in {% for %} tag. Use '{% for item in collection %}'/,
			);
		});

		it("should handle plain text only", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "Just plain text.";
			const tokens = tokenize(template);
			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "text", value: "Just plain text." },
			]);
		});

		it("should handle whitespace-only template", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "   \n	  ";
			const tokens = tokenize(template);
			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "text", value: "   \n	  " },
			]);
		});

		it("should tokenize a mix of control flow and variables", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template =
				"{% if user %}Hi, {{ user.name }}!{% else %}Log in.{% endif %}";
			const tokens = tokenize(template);

			t.assert.deepStrictEqual<Token[]>(tokens, [
				{ condition: "user", type: "if" },
				{ type: "text", value: "Hi, " },
				{ type: "variable" },
				{ name: "user", type: "identifier" },
				{ type: "dot" },
				{ name: "name", type: "identifier" },
				{ type: "text", value: "!" },
				{ type: "else" },
				{ type: "text", value: "Log in." },
				{ type: "endif" },
			]);
		});

		it("should throw on unclosed extends tag", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% extends 'layout'";
			t.assert.throws(() => tokenize(template), /Unclosed {% extends %} tag/);
		});

		it("should throw on unclosed block tag", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% block content";
			t.assert.throws(() => tokenize(template), /Unclosed {% block %} tag/);
		});

		it("should throw on unclosed endif tag", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% endif";
			t.assert.throws(() => tokenize(template), /Unclosed {% endif %} tag/);
		});

		it("should throw on unclosed variable tag", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{{ user.name";
			t.assert.throws(
				() => tokenize(template),
				/Unclosed variable tag starting at index 0/,
			);
		});

		it("should throw on unclosed if tag", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% if condition";
			t.assert.throws(() => tokenize(template), /Unclosed {% if %} tag/);
		});

		it("should throw on unclosed else tag", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% else";
			t.assert.throws(() => tokenize(template), /Unclosed {% else %} tag/);
		});

		it("should throw on unclosed endif tag", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% endif";
			t.assert.throws(() => tokenize(template), /Unclosed {% endif %} tag/);
		});

		it("should throw on unclosed endfor tag", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% endfor";
			t.assert.throws(() => tokenize(template), /Unclosed {% endfor %} tag/);
		});

		it("should throw on unclosed endblock tag", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% endblock";
			t.assert.throws(() => tokenize(template), /Unclosed {% endblock %} tag/);
		});

		it("should throw on unknown control tag", (t: TestContext) => {
			t.plan(1);
			const { tokenize } = setupTokenizer();
			const template = "{% foo %}";
			t.assert.throws(() => tokenize(template), {
				column: 1,
				line: 1,
				message: "Unknown control tag",
				name: "TokenizerError",
				snippet: "{% foo %}",
				templateName: "test-template",
			});
		});
	});
});
