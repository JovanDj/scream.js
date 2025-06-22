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
				{ type: "variable", value: "name" },
			]);
		});

		it("should tokenize empty variable", () => {
			const template = "{{}}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable", value: "" },
			]);
		});

		it("should tokenize trailing brace as text after variable", () => {
			const tokens = tokenizer.tokenize("{{}}}");

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable", value: "" },
				{ type: "text", value: "}" },
			]);
		});

		it("should tokenize multiple variables", () => {
			const template = "{{ firstName }} {{ lastName }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable", value: "firstName" },
				{ type: "text", value: " " },
				{ type: "variable", value: "lastName" },
			]);
		});

		it("should tokenize variables with surrounding text", () => {
			const template = "Hello, {{ name }}!";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "text", value: "Hello, " },
				{ type: "variable", value: "name" },
				{ type: "text", value: "!" },
			]);
		});

		it("should tokenize variables with leading and trailing spaces", () => {
			const template = "  {{ name }}  ";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "text", value: "  " },
				{ type: "variable", value: "name" },
				{ type: "text", value: "  " },
			]);
		});

		it("should tokenize adjacent variables without spaces", () => {
			const template = "{{ firstName }}{{ lastName }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable", value: "firstName" },
				{ type: "variable", value: "lastName" },
			]);
		});

		it("should handle variables with special characters", () => {
			const template = "{{ user.email }} {{ user['first-name'] }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable", value: "user.email" },
				{ type: "text", value: " " },
				{ type: "variable", value: "user['first-name']" },
			]);
		});

		it("should handle nested variables", () => {
			const template = "Welcome {{ user.profile.name }}!";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "text", value: "Welcome " },
				{ type: "variable", value: "user.profile.name" },
				{ type: "text", value: "!" },
			]);
		});

		it("should handle variables with no content between them", () => {
			const template = "{{ a }}{{ b }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "variable", value: "a" },
				{ type: "variable", value: "b" },
			]);
		});

		it("should handle deeply nested variables", () => {
			const template = "{{ a.b.c.d.e.f.g.h.i.j.k }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{
					type: "variable",
					value: "a.b.c.d.e.f.g.h.i.j.k",
				},
			]);
		});
	});

	describe("Conditionals", () => {
		it("should tokenize simple conditionals", () => {
			const template = "{% if isLoggedIn %} Welcome! {% endif %}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "if", value: "isLoggedIn" },
				{ type: "text", value: " Welcome! " },
				{ type: "endif", value: "" },
			]);
		});

		it("should tokenize conditionals with else", () => {
			const template =
				"{% if isLoggedIn %} Welcome! {% else %} Please log in. {% endif %}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "if", value: "isLoggedIn" },
				{ type: "text", value: " Welcome! " },
				{ type: "else", value: "" },
				{ type: "text", value: " Please log in. " },
				{ type: "endif", value: "" },
			]);
		});
	});

	describe("Iterations", () => {
		it("should tokenize a simple for loop", () => {
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "for", value: "letters", iterator: "letter" },
				{ type: "text", value: " " },
				{ type: "variable", value: "letter" },
				{ type: "text", value: " " },
				{ type: "endfor", value: "" },
			]);
		});

		it("should tokenize nested for loops", () => {
			const template =
				"{% for user in users %} {% for task in user.tasks %} {{ task.title }} {% endfor %} {% endfor %}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "for", value: "users", iterator: "user" },
				{ type: "text", value: " " },
				{ type: "for", value: "user.tasks", iterator: "task" },
				{ type: "text", value: " " },
				{ type: "variable", value: "task.title" },
				{ type: "text", value: " " },
				{ type: "endfor", value: "" },
				{ type: "text", value: " " },
				{ type: "endfor", value: "" },
			]);
		});

		it("should handle an empty loop gracefully", () => {
			const template = "{% for item in emptyArray %}{% endfor %}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "for", value: "emptyArray", iterator: "item" },
				{ type: "endfor", value: "" },
			]);
		});
	});

	describe("Layouts", () => {
		it("should tokenize layouts ", () => {
			const template = `{% extends "layout" %}`;

			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "extends", value: "layout" },
			]);
		});

		it("should tokenize blocks", () => {
			const template = "{% block content %}{% endblock content %}";

			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual<Token[]>(tokens, [
				{ type: "block", value: "content" },
				{ type: "endblock", value: "" },
			]);
		});
	});

	describe("Tokenizer – Edge Cases & Errors", () => {
		it.todo("should throw on unclosed variable tag");

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

		it.todo("should throw on malformed for tag (missing iterator)");

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
				{ type: "if", value: "user" },
				{ type: "text", value: "Hi, " },
				{ type: "variable", value: "user.name" },
				{ type: "text", value: "!" },
				{ type: "else", value: "" },
				{ type: "text", value: "Log in." },
				{ type: "endif", value: "" },
			]);
		});
	});
});
