import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { type Token, Tokenizer } from "./tokenizer.js";

describe("Tokenizer", { concurrency: true }, () => {
	let tokenizer: Tokenizer;

	beforeEach(() => {
		tokenizer = new Tokenizer();
	});

	describe("Variable replacement", () => {
		it("should tokenize a single variable", () => {
			const template = "{{ name }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable" },
				{ name: "name", type: "identifier" },
			]);
		});

		it("should tokenize empty variable", () => {
			const template = "{{}}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [{ type: "variable" }]);
		});

		it("should tokenize trailing brace as text after variable", () => {
			const tokens = tokenizer.tokenize("{{}}}");

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable" },
				{ type: "text", value: "}" },
			]);
		});

		it("should tokenize multiple variables", () => {
			const template = "{{ firstName }} {{ lastName }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable" },
				{ name: "firstName", type: "identifier" },
				{ type: "text", value: " " },
				{ type: "variable" },
				{ name: "lastName", type: "identifier" },
			]);
		});

		it("should tokenize variables with surrounding text", () => {
			const template = "Hello, {{ name }}!";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "text", value: "Hello, " },
				{ type: "variable" },
				{ name: "name", type: "identifier" },
				{ type: "text", value: "!" },
			]);
		});

		it("should tokenize nested variables with dot notation", () => {
			const template = "Welcome {{ user.profile.name }}!";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
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

		it("should tokenize variables with bracket notation and strings", () => {
			const template = "{{ user['first-name'] }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable" },
				{ name: "user", type: "identifier" },
				{ type: "string", value: "first-name" },
			]);
		});

		it("should tokenize deeply nested variables", () => {
			const template = "{{ a.b.c.d }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
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

		it("should tokenize variables with numbers", () => {
			const template = "{{ items[12] }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable" },
				{ name: "items", type: "identifier" },
				{ type: "number", value: 12 },
			]);
		});
	});

	describe("Conditionals", () => {
		it("should tokenize simple conditionals", () => {
			const template = "{% if isLoggedIn %} Welcome! {% endif %}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ condition: "isLoggedIn", type: "if" },
				{ type: "text", value: " Welcome! " },
				{ type: "endif" },
			]);
		});

		it("should tokenize conditionals with else", () => {
			const template =
				"{% if isLoggedIn %} Welcome! {% else %} Please log in. {% endif %}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ condition: "isLoggedIn", type: "if" },
				{ type: "text", value: " Welcome! " },
				{ type: "else" },
				{ type: "text", value: " Please log in. " },
				{ type: "endif" },
			]);
		});
	});

	describe("Iterations", () => {
		it("should tokenize a simple for loop", () => {
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ collection: "letters", iterator: "letter", type: "for" },
				{ type: "text", value: " " },
				{ type: "variable" },
				{ name: "letter", type: "identifier" },
				{ type: "text", value: " " },
				{ type: "endfor" },
			]);
		});

		it("should tokenize nested for loops", () => {
			const template =
				"{% for user in users %} {% for task in user.tasks %} {{ task.title }} {% endfor %} {% endfor %}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
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

		it("should handle an empty loop gracefully", () => {
			const template = "{% for item in emptyArray %}{% endfor %}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ collection: "emptyArray", iterator: "item", type: "for" },
				{ type: "endfor" },
			]);
		});
	});

	describe("Layouts", () => {
		it("should tokenize layouts ", () => {
			const template = `{% extends "layout" %}`;

			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ template: "layout", type: "extends" },
			]);
		});

		it("should tokenize layouts with single quotes", () => {
			const template = `{% extends 'layout' %}`;
			const tokens = tokenizer.tokenize(template);
			assert.deepStrictEqual<Token[]>(tokens, [
				{ template: "layout", type: "extends" },
			]);
		});

		it("should tokenize a named block", () => {
			const template = "{% block content %}Hello{% endblock %}";
			const tokens = tokenizer.tokenize(template);
			assert.deepStrictEqual<Token[]>(tokens, [
				{ name: "content", type: "block" },
				{ type: "text", value: "Hello" },
				{ name: "", type: "endblock" },
			]);
		});

		it("should tokenize an endblock with an optional name", () => {
			const template = "{% block content %}Hello{% endblock content %}";
			const tokens = tokenizer.tokenize(template);
			assert.deepStrictEqual<Token[]>(tokens, [
				{ name: "content", type: "block" },
				{ type: "text", value: "Hello" },
				{ name: "content", type: "endblock" },
			]);
		});
	});

	describe("Edge Cases & Errors", () => {
		it("should throw on unclosed for block", () => {
			const template = "{% for item in items";
			assert.throws(() => tokenizer.tokenize(template), /Unclosed {% for %}/);
		});

		it("should throw on malformed for tag (missing 'in')", () => {
			const template = "{% for item items %}";
			assert.throws(
				() => tokenizer.tokenize(template),
				/Invalid syntax in {% for %}/,
			);
		});

		it("should throw on malformed for tag (missing iterator)", () => {
			const template = "{% for in items %}";
			assert.throws(
				() => tokenizer.tokenize(template),
				/Invalid syntax in {% for %} tag. Use '{% for item in collection %}'/,
			);
		});

		it("should handle plain text only", () => {
			const template = "Just plain text.";
			const tokens = tokenizer.tokenize(template);
			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "text", value: "Just plain text." },
			]);
		});

		it("should handle whitespace-only template", () => {
			const template = "   \n\t  ";
			const tokens = tokenizer.tokenize(template);
			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "text", value: "   \n\t  " },
			]);
		});

		it("should tokenize a mix of control flow and variables", () => {
			const template =
				"{% if user %}Hi, {{ user.name }}!{% else %}Log in.{% endif %}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
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

		it("should throw on unclosed extends tag", () => {
			const template = "{% extends 'layout'";
			assert.throws(
				() => tokenizer.tokenize(template),
				/Unclosed {% extends %} tag/,
			);
		});

		it("should throw on unclosed block tag", () => {
			const template = "{% block content";
			assert.throws(
				() => tokenizer.tokenize(template),
				/Unclosed {% block %} tag/,
			);
		});

		it("should throw on unclosed endif tag", () => {
			const template = "{% endif";
			assert.throws(
				() => tokenizer.tokenize(template),
				/Unclosed {% endif %} tag/,
			);
		});

		it("should throw on unclosed variable tag", () => {
			const template = "{{ user.name";
			assert.throws(
				() => tokenizer.tokenize(template),
				/Unclosed variable tag starting at index 0/,
			);
		});

		it("should throw on unclosed if tag", () => {
			const template = "{% if condition";
			assert.throws(
				() => tokenizer.tokenize(template),
				/Unclosed {% if %} tag/,
			);
		});

		it("should throw on unclosed else tag", () => {
			const template = "{% else";
			assert.throws(
				() => tokenizer.tokenize(template),
				/Unclosed {% else %} tag/,
			);
		});

		it("should throw on unclosed endif tag", () => {
			const template = "{% endif";
			assert.throws(
				() => tokenizer.tokenize(template),
				/Unclosed {% endif %} tag/,
			);
		});

		it("should throw on unclosed endfor tag", () => {
			const template = "{% endfor";
			assert.throws(
				() => tokenizer.tokenize(template),
				/Unclosed {% endfor %} tag/,
			);
		});

		it("should throw on unclosed endblock tag", () => {
			const template = "{% endblock";
			assert.throws(
				() => tokenizer.tokenize(template),
				/Unclosed {% endblock %} tag/,
			);
		});
	});
});
