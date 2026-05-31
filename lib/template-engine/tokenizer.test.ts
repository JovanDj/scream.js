import { beforeEach, describe, it, type TestContext } from "node:test";

import { type Token, Tokenizer } from "./tokenizer.js";

describe("Tokenizer", { concurrency: true }, () => {
	let tokenizer: Tokenizer;

	beforeEach(() => {
		tokenizer = new Tokenizer();
	});

	describe("Variable replacement", () => {
		it("should tokenize a single variable", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("{{ name }}");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openVariable" },
				{ span: { end: 7, start: 3 }, type: "identifier", value: "name" },
				{ span: { end: 10, start: 8 }, type: "closeVariable" },
			]);
		});

		it("should tokenize empty variable", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("{{}}");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openVariable" },
				{ span: { end: 4, start: 2 }, type: "closeVariable" },
			]);
		});

		it("should tokenize trailing brace as text after variable", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("{{}}}");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openVariable" },
				{ span: { end: 4, start: 2 }, type: "closeVariable" },
				{ span: { end: 5, start: 4 }, type: "text", value: "}" },
			]);
		});

		it("should tokenize multiple variables", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("{{ firstName }} {{ lastName }}");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openVariable" },
				{
					span: { end: 12, start: 3 },
					type: "identifier",
					value: "firstName",
				},
				{ span: { end: 15, start: 13 }, type: "closeVariable" },
				{ span: { end: 16, start: 15 }, type: "text", value: " " },
				{ span: { end: 18, start: 16 }, type: "openVariable" },
				{
					span: { end: 27, start: 19 },
					type: "identifier",
					value: "lastName",
				},
				{ span: { end: 30, start: 28 }, type: "closeVariable" },
			]);
		});

		it("should tokenize multiple variables and trailing text", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("{{ firstName }} {{ lastName }}!");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openVariable" },
				{
					span: { end: 12, start: 3 },
					type: "identifier",
					value: "firstName",
				},
				{ span: { end: 15, start: 13 }, type: "closeVariable" },
				{ span: { end: 16, start: 15 }, type: "text", value: " " },
				{ span: { end: 18, start: 16 }, type: "openVariable" },
				{
					span: { end: 27, start: 19 },
					type: "identifier",
					value: "lastName",
				},
				{ span: { end: 30, start: 28 }, type: "closeVariable" },
				{ span: { end: 31, start: 30 }, type: "text", value: "!" },
			]);
		});

		it("should tokenize variables with surrounding text", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("Hello, {{ name }}!");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 7, start: 0 }, type: "text", value: "Hello, " },
				{ span: { end: 9, start: 7 }, type: "openVariable" },
				{ span: { end: 14, start: 10 }, type: "identifier", value: "name" },
				{ span: { end: 17, start: 15 }, type: "closeVariable" },
				{ span: { end: 18, start: 17 }, type: "text", value: "!" },
			]);
		});

		it("should tokenize nested variables with dot notation", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("Welcome {{ user.profile.name }}!");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 8, start: 0 }, type: "text", value: "Welcome " },
				{ span: { end: 10, start: 8 }, type: "openVariable" },
				{ span: { end: 15, start: 11 }, type: "identifier", value: "user" },
				{ span: { end: 16, start: 15 }, type: "dot" },
				{
					span: { end: 23, start: 16 },
					type: "identifier",
					value: "profile",
				},
				{ span: { end: 24, start: 23 }, type: "dot" },
				{ span: { end: 28, start: 24 }, type: "identifier", value: "name" },
				{ span: { end: 31, start: 29 }, type: "closeVariable" },
				{ span: { end: 32, start: 31 }, type: "text", value: "!" },
			]);
		});

		it("should tokenize variables with bracket notation and strings", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("{{ user['first-name'] }}");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openVariable" },
				{ span: { end: 7, start: 3 }, type: "identifier", value: "user" },
				{ span: { end: 8, start: 7 }, type: "leftBracket" },
				{ span: { end: 20, start: 8 }, type: "string", value: "first-name" },
				{ span: { end: 21, start: 20 }, type: "rightBracket" },
				{ span: { end: 24, start: 22 }, type: "closeVariable" },
			]);
		});

		it("should tokenize deeply nested variables", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("{{ a.b.c.d }}");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openVariable" },
				{ span: { end: 4, start: 3 }, type: "identifier", value: "a" },
				{ span: { end: 5, start: 4 }, type: "dot" },
				{ span: { end: 6, start: 5 }, type: "identifier", value: "b" },
				{ span: { end: 7, start: 6 }, type: "dot" },
				{ span: { end: 8, start: 7 }, type: "identifier", value: "c" },
				{ span: { end: 9, start: 8 }, type: "dot" },
				{ span: { end: 10, start: 9 }, type: "identifier", value: "d" },
				{ span: { end: 13, start: 11 }, type: "closeVariable" },
			]);
		});

		it("should tokenize variables with numbers", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("{{ items[12] }}");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openVariable" },
				{ span: { end: 8, start: 3 }, type: "identifier", value: "items" },
				{ span: { end: 9, start: 8 }, type: "leftBracket" },
				{ span: { end: 11, start: 9 }, type: "number", value: 12 },
				{ span: { end: 12, start: 11 }, type: "rightBracket" },
				{ span: { end: 15, start: 13 }, type: "closeVariable" },
			]);
		});
	});

	describe("Conditionals", () => {
		it("should tokenize simple conditionals", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize(
				"{% if isLoggedIn %} Welcome! {% endif %}",
			);

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openDirective" },
				{ span: { end: 5, start: 3 }, type: "keyword", value: "if" },
				{
					span: { end: 16, start: 6 },
					type: "identifier",
					value: "isLoggedIn",
				},
				{ span: { end: 19, start: 17 }, type: "closeDirective" },
				{ span: { end: 29, start: 19 }, type: "text", value: " Welcome! " },
				{ span: { end: 31, start: 29 }, type: "openDirective" },
				{ span: { end: 37, start: 32 }, type: "keyword", value: "endif" },
				{ span: { end: 40, start: 38 }, type: "closeDirective" },
			]);
		});

		it("should tokenize conditionals with else", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize(
				"{% if isLoggedIn %} Welcome! {% else %} Please log in. {% endif %}",
			);

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openDirective" },
				{ span: { end: 5, start: 3 }, type: "keyword", value: "if" },
				{
					span: { end: 16, start: 6 },
					type: "identifier",
					value: "isLoggedIn",
				},
				{ span: { end: 19, start: 17 }, type: "closeDirective" },
				{ span: { end: 29, start: 19 }, type: "text", value: " Welcome! " },
				{ span: { end: 31, start: 29 }, type: "openDirective" },
				{ span: { end: 36, start: 32 }, type: "keyword", value: "else" },
				{ span: { end: 39, start: 37 }, type: "closeDirective" },
				{
					span: { end: 55, start: 39 },
					type: "text",
					value: " Please log in. ",
				},
				{ span: { end: 57, start: 55 }, type: "openDirective" },
				{ span: { end: 63, start: 58 }, type: "keyword", value: "endif" },
				{ span: { end: 66, start: 64 }, type: "closeDirective" },
			]);
		});
	});

	describe("Iterations", () => {
		it("should tokenize a simple for loop", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize(
				"{% for letter in letters %} {{ letter }} {% endfor %}",
			);

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openDirective" },
				{ span: { end: 6, start: 3 }, type: "keyword", value: "for" },
				{ span: { end: 13, start: 7 }, type: "identifier", value: "letter" },
				{ span: { end: 16, start: 14 }, type: "keyword", value: "in" },
				{
					span: { end: 24, start: 17 },
					type: "identifier",
					value: "letters",
				},
				{ span: { end: 27, start: 25 }, type: "closeDirective" },
				{ span: { end: 28, start: 27 }, type: "text", value: " " },
				{ span: { end: 30, start: 28 }, type: "openVariable" },
				{ span: { end: 37, start: 31 }, type: "identifier", value: "letter" },
				{ span: { end: 40, start: 38 }, type: "closeVariable" },
				{ span: { end: 41, start: 40 }, type: "text", value: " " },
				{ span: { end: 43, start: 41 }, type: "openDirective" },
				{ span: { end: 50, start: 44 }, type: "keyword", value: "endfor" },
				{ span: { end: 53, start: 51 }, type: "closeDirective" },
			]);
		});

		it("should tokenize nested for loops", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize(
				"{% for user in users %} {% for task in user.tasks %} {{ task.title }} {% endfor %} {% endfor %}",
			);

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openDirective" },
				{ span: { end: 6, start: 3 }, type: "keyword", value: "for" },
				{ span: { end: 11, start: 7 }, type: "identifier", value: "user" },
				{ span: { end: 14, start: 12 }, type: "keyword", value: "in" },
				{ span: { end: 20, start: 15 }, type: "identifier", value: "users" },
				{ span: { end: 23, start: 21 }, type: "closeDirective" },
				{ span: { end: 24, start: 23 }, type: "text", value: " " },
				{ span: { end: 26, start: 24 }, type: "openDirective" },
				{ span: { end: 30, start: 27 }, type: "keyword", value: "for" },
				{ span: { end: 35, start: 31 }, type: "identifier", value: "task" },
				{ span: { end: 38, start: 36 }, type: "keyword", value: "in" },
				{ span: { end: 43, start: 39 }, type: "identifier", value: "user" },
				{ span: { end: 44, start: 43 }, type: "dot" },
				{ span: { end: 49, start: 44 }, type: "identifier", value: "tasks" },
				{ span: { end: 52, start: 50 }, type: "closeDirective" },
				{ span: { end: 53, start: 52 }, type: "text", value: " " },
				{ span: { end: 55, start: 53 }, type: "openVariable" },
				{ span: { end: 60, start: 56 }, type: "identifier", value: "task" },
				{ span: { end: 61, start: 60 }, type: "dot" },
				{ span: { end: 66, start: 61 }, type: "identifier", value: "title" },
				{ span: { end: 69, start: 67 }, type: "closeVariable" },
				{ span: { end: 70, start: 69 }, type: "text", value: " " },
				{ span: { end: 72, start: 70 }, type: "openDirective" },
				{ span: { end: 79, start: 73 }, type: "keyword", value: "endfor" },
				{ span: { end: 82, start: 80 }, type: "closeDirective" },
				{ span: { end: 83, start: 82 }, type: "text", value: " " },
				{ span: { end: 85, start: 83 }, type: "openDirective" },
				{ span: { end: 92, start: 86 }, type: "keyword", value: "endfor" },
				{ span: { end: 95, start: 93 }, type: "closeDirective" },
			]);
		});

		it("should handle an empty loop gracefully", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize(
				"{% for item in emptyArray %}{% endfor %}",
			);

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openDirective" },
				{ span: { end: 6, start: 3 }, type: "keyword", value: "for" },
				{ span: { end: 11, start: 7 }, type: "identifier", value: "item" },
				{ span: { end: 14, start: 12 }, type: "keyword", value: "in" },
				{
					span: { end: 25, start: 15 },
					type: "identifier",
					value: "emptyArray",
				},
				{ span: { end: 28, start: 26 }, type: "closeDirective" },
				{ span: { end: 30, start: 28 }, type: "openDirective" },
				{ span: { end: 37, start: 31 }, type: "keyword", value: "endfor" },
				{ span: { end: 40, start: 38 }, type: "closeDirective" },
			]);
		});
	});

	describe("Layouts", () => {
		it("should tokenize layouts ", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize('{% extends "layout" %}');

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openDirective" },
				{ span: { end: 10, start: 3 }, type: "keyword", value: "extends" },
				{ span: { end: 19, start: 11 }, type: "string", value: "layout" },
				{ span: { end: 22, start: 20 }, type: "closeDirective" },
			]);
		});

		it("should tokenize layouts with single quotes", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("{% extends 'layout' %}");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openDirective" },
				{ span: { end: 10, start: 3 }, type: "keyword", value: "extends" },
				{ span: { end: 19, start: 11 }, type: "string", value: "layout" },
				{ span: { end: 22, start: 20 }, type: "closeDirective" },
			]);
		});

		it("should tokenize a named block", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize(
				"{% block content %}Hello{% endblock %}",
			);

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openDirective" },
				{ span: { end: 8, start: 3 }, type: "keyword", value: "block" },
				{ span: { end: 16, start: 9 }, type: "identifier", value: "content" },
				{ span: { end: 19, start: 17 }, type: "closeDirective" },
				{ span: { end: 24, start: 19 }, type: "text", value: "Hello" },
				{ span: { end: 26, start: 24 }, type: "openDirective" },
				{ span: { end: 35, start: 27 }, type: "keyword", value: "endblock" },
				{ span: { end: 38, start: 36 }, type: "closeDirective" },
			]);
		});

		it("should tokenize an endblock with an optional name", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize(
				"{% block content %}Hello{% endblock content %}",
			);

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openDirective" },
				{ span: { end: 8, start: 3 }, type: "keyword", value: "block" },
				{ span: { end: 16, start: 9 }, type: "identifier", value: "content" },
				{ span: { end: 19, start: 17 }, type: "closeDirective" },
				{ span: { end: 24, start: 19 }, type: "text", value: "Hello" },
				{ span: { end: 26, start: 24 }, type: "openDirective" },
				{ span: { end: 35, start: 27 }, type: "keyword", value: "endblock" },
				{
					span: { end: 43, start: 36 },
					type: "identifier",
					value: "content",
				},
				{ span: { end: 46, start: 44 }, type: "closeDirective" },
			]);
		});
	});

	describe("Edge Cases & Errors", () => {
		it("should throw on unclosed for block", (t: TestContext) => {
			t.plan(1);
			const act = () => tokenizer.tokenize("{% for item in items");

			t.assert.throws(act, /Unclosed directive tag/);
		});

		it("should tokenize malformed for tag with missing in for parser validation", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("{% for item items %}");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openDirective" },
				{ span: { end: 6, start: 3 }, type: "keyword", value: "for" },
				{ span: { end: 11, start: 7 }, type: "identifier", value: "item" },
				{ span: { end: 17, start: 12 }, type: "identifier", value: "items" },
				{ span: { end: 20, start: 18 }, type: "closeDirective" },
			]);
		});

		it("should tokenize malformed for tag with missing iterator for parser validation", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("{% for in items %}");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openDirective" },
				{ span: { end: 6, start: 3 }, type: "keyword", value: "for" },
				{ span: { end: 9, start: 7 }, type: "keyword", value: "in" },
				{ span: { end: 15, start: 10 }, type: "identifier", value: "items" },
				{ span: { end: 18, start: 16 }, type: "closeDirective" },
			]);
		});

		it("should handle plain text only", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("Just plain text.");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{
					span: { end: 16, start: 0 },
					type: "text",
					value: "Just plain text.",
				},
			]);
		});

		it("should handle whitespace-only template", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize("   \n\t  ");

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 7, start: 0 }, type: "text", value: "   \n\t  " },
			]);
		});

		it("should tokenize a mix of control flow and variables", (t: TestContext) => {
			t.plan(1);
			const result = tokenizer.tokenize(
				"{% if user %}Hi, {{ user.name }}!{% else %}Log in.{% endif %}",
			);

			t.assert.deepStrictEqual<readonly Token[]>(result, [
				{ span: { end: 2, start: 0 }, type: "openDirective" },
				{ span: { end: 5, start: 3 }, type: "keyword", value: "if" },
				{ span: { end: 10, start: 6 }, type: "identifier", value: "user" },
				{ span: { end: 13, start: 11 }, type: "closeDirective" },
				{ span: { end: 17, start: 13 }, type: "text", value: "Hi, " },
				{ span: { end: 19, start: 17 }, type: "openVariable" },
				{ span: { end: 24, start: 20 }, type: "identifier", value: "user" },
				{ span: { end: 25, start: 24 }, type: "dot" },
				{ span: { end: 29, start: 25 }, type: "identifier", value: "name" },
				{ span: { end: 32, start: 30 }, type: "closeVariable" },
				{ span: { end: 33, start: 32 }, type: "text", value: "!" },
				{ span: { end: 35, start: 33 }, type: "openDirective" },
				{ span: { end: 40, start: 36 }, type: "keyword", value: "else" },
				{ span: { end: 43, start: 41 }, type: "closeDirective" },
				{ span: { end: 50, start: 43 }, type: "text", value: "Log in." },
				{ span: { end: 52, start: 50 }, type: "openDirective" },
				{ span: { end: 58, start: 53 }, type: "keyword", value: "endif" },
				{ span: { end: 61, start: 59 }, type: "closeDirective" },
			]);
		});

		it("should throw on unclosed extends tag", (t: TestContext) => {
			t.plan(1);
			const act = () => tokenizer.tokenize("{% extends 'layout'");

			t.assert.throws(act, /Unclosed directive tag/);
		});

		it("should throw on unclosed block tag", (t: TestContext) => {
			t.plan(1);
			const act = () => tokenizer.tokenize("{% block content");

			t.assert.throws(act, /Unclosed directive tag/);
		});

		it("should throw on unclosed endif tag", (t: TestContext) => {
			t.plan(1);
			const act = () => tokenizer.tokenize("{% endif");

			t.assert.throws(act, /Unclosed directive tag/);
		});

		it("should throw on unclosed variable tag", (t: TestContext) => {
			t.plan(1);
			const act = () => tokenizer.tokenize("{{ user.name");

			t.assert.throws(act, /Unclosed variable tag/);
		});

		it("should throw on malformed single-close variable tag", (t: TestContext) => {
			t.plan(1);
			const act = () => tokenizer.tokenize("{{ name }");

			t.assert.throws(act, /Unclosed variable tag/);
		});

		it("should throw on unclosed string literal", (t: TestContext) => {
			t.plan(1);
			const act = () => tokenizer.tokenize('{{ "name }}');

			t.assert.throws(act, /Unclosed string literal/);
		});

		it("should throw on unclosed if tag", (t: TestContext) => {
			t.plan(1);
			const act = () => tokenizer.tokenize("{% if condition");

			t.assert.throws(act, /Unclosed directive tag/);
		});

		it("should throw on unclosed else tag", (t: TestContext) => {
			t.plan(1);
			const act = () => tokenizer.tokenize("{% else");

			t.assert.throws(act, /Unclosed directive tag/);
		});

		it("should throw on unclosed endif tag", (t: TestContext) => {
			t.plan(1);
			const act = () => tokenizer.tokenize("{% endif");

			t.assert.throws(act, /Unclosed directive tag/);
		});

		it("should throw on unclosed endfor tag", (t: TestContext) => {
			t.plan(1);
			const act = () => tokenizer.tokenize("{% endfor");

			t.assert.throws(act, /Unclosed directive tag/);
		});

		it("should throw on unclosed endblock tag", (t: TestContext) => {
			t.plan(1);
			const act = () => tokenizer.tokenize("{% endblock");

			t.assert.throws(act, /Unclosed directive tag/);
		});
	});
});
