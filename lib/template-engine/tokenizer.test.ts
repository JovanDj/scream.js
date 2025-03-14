import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Tokenizer } from "./tokenizer.js";

describe("Tokenizer", { concurrency: true }, () => {
	let tokenizer: Tokenizer;

	beforeEach(() => {
		tokenizer = new Tokenizer();
	});

	describe("Variable replacement", () => {
		it("should tokenize a single variable", () => {
			const template = "{{ name }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual(tokens, [{ type: "variable", value: "name" }]);
		});

		it("should tokenize multiple variables", () => {
			const template = "{{ firstName }} {{ lastName }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual(tokens, [
				{ type: "variable", value: "firstName" },
				{ type: "text", value: " " },
				{ type: "variable", value: "lastName" },
			]);
		});

		it("should tokenize variables with surrounding text", () => {
			const template = "Hello, {{ name }}!";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual(tokens, [
				{ type: "text", value: "Hello, " },
				{ type: "variable", value: "name" },
				{ type: "text", value: "!" },
			]);
		});

		it("should tokenize variables with leading and trailing spaces", () => {
			const template = "  {{ name }}  ";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual(tokens, [
				{ type: "text", value: "  " },
				{ type: "variable", value: "name" },
				{ type: "text", value: "  " },
			]);
		});

		it("should tokenize adjacent variables without spaces", () => {
			const template = "{{ firstName }}{{ lastName }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual(tokens, [
				{ type: "variable", value: "firstName" },
				{ type: "variable", value: "lastName" },
			]);
		});

		it("should handle variables with special characters", () => {
			const template = "{{ user.email }} {{ user['first-name'] }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual(tokens, [
				{ type: "variable", value: "user.email" },
				{ type: "text", value: " " },
				{ type: "variable", value: "user['first-name']" },
			]);
		});

		it("should handle nested variables", () => {
			const template = "Welcome {{ user.profile.name }}!";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual(tokens, [
				{ type: "text", value: "Welcome " },
				{ type: "variable", value: "user.profile.name" },
				{ type: "text", value: "!" },
			]);
		});

		it("should handle variables with no content between them", () => {
			const template = "{{ a }}{{ b }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual(tokens, [
				{ type: "variable", value: "a" },
				{ type: "variable", value: "b" },
			]);
		});

		it("should handle deeply nested variables", () => {
			const template = "{{ a.b.c.d.e.f.g.h.i.j.k }}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual(tokens, [
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

			assert.deepStrictEqual(tokens, [
				{ type: "if", value: "isLoggedIn" },
				{ type: "text", value: " Welcome! " },
				{ type: "endif", value: "" },
			]);
		});

		it("should tokenize conditionals with else", () => {
			const template =
				"{% if isLoggedIn %} Welcome! {% else %} Please log in. {% endif %}";
			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual(tokens, [
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

			assert.deepStrictEqual(tokens, [
				{ iterator: "letter", type: "for", value: "letters" },
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

			assert.deepStrictEqual(tokens, [
				{ iterator: "user", type: "for", value: "users" },
				{ type: "text", value: " " },
				{ iterator: "task", type: "for", value: "user.tasks" },
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

			assert.deepStrictEqual(tokens, [
				{ iterator: "item", type: "for", value: "emptyArray" },
				{ type: "endfor", value: "" },
			]);
		});
	});

	describe("Layouts", () => {
		it("should tokenize layouts ", () => {
			const template = `{% extends "layout" %}`;

			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual(tokens, [{ type: "extends", value: "layout" }]);
		});

		it("should tokenize blocks", () => {
			const template = "{% block content %}{% endblock content %}";

			const tokens = tokenizer.tokenize(template);

			assert.deepStrictEqual(tokens, [
				{ type: "block", value: "content" },
				{ type: "endblock", value: "" },
			]);
		});
	});
});
