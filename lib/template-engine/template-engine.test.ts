import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { ScreamTemplateEngine } from "./template-engine.js";

describe("ScreamTemplateEngine", () => {
	let templateEngine: ScreamTemplateEngine;

	beforeEach(() => {
		templateEngine = new ScreamTemplateEngine();
	});

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
