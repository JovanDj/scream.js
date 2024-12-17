import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Generator } from "./generator.js";
import type { ASTNode } from "./parser.js";

describe("Generator", () => {
	let generator: Generator;

	beforeEach(() => {
		generator = new Generator();
	});

	describe("Text nodes", () => {
		it("should return the text value of a text node", () => {
			const ast: ASTNode[] = [
				{ children: [], type: "text", value: "Hello, World!" },
			];
			const result = generator.generate(ast, {});
			assert.strictEqual(result, "Hello, World!");
		});

		it("should handle empty text nodes", () => {
			const ast: ASTNode[] = [{ children: [], type: "text", value: "" }];
			const result = generator.generate(ast, {});
			assert.strictEqual(result, "");
		});
	});

	describe("Variable nodes", () => {
		it("should replace a single variable", () => {
			const ast: ASTNode[] = [
				{ children: [], type: "variable", value: "name" },
			];
			const context = { name: "John" };
			const result = generator.generate(ast, context);
			assert.strictEqual(result, "John");
		});

		it("should return an empty string for undefined variables", () => {
			const ast: ASTNode[] = [{ children: [], type: "variable", value: "age" }];
			const context = {};
			const result = generator.generate(ast, context);
			assert.strictEqual(result, "");
		});

		it("should handle nested variables", () => {
			const ast: ASTNode[] = [
				{ children: [], type: "variable", value: "user.name" },
			];
			const context = { user: { name: "Jane" } };
			const result = generator.generate(ast, context);
			assert.strictEqual(result, "Jane");
		});
	});

	describe("Generator - Conditional Nodes", () => {
		it("should render the children of an if node when the condition is true", () => {
			const ast: ASTNode[] = [
				{
					alternate: [],
					children: [{ children: [], type: "text", value: "Welcome, Admin!" }],
					type: "if",
					value: "isAdmin",
				},
			];
			const context = { isAdmin: true };
			const result = generator.generate(ast, context);
			assert.strictEqual(result, "Welcome, Admin!");
		});

		it("should render the alternate of an if node when the condition is false", () => {
			const ast: ASTNode[] = [
				{
					alternate: [{ children: [], type: "text", value: "Access Denied." }],
					children: [{ children: [], type: "text", value: "Welcome, Admin!" }],
					type: "if",
					value: "isAdmin",
				},
			];
			const context = { isAdmin: false };
			const result = generator.generate(ast, context);
			assert.strictEqual(result, "Access Denied.");
		});

		it("should render nothing if there are no children or alternate", () => {
			const ast: ASTNode[] = [
				{ alternate: [], children: [], type: "if", value: "isAdmin" },
			];
			const context = { isAdmin: false };
			const result = generator.generate(ast, context);
			assert.strictEqual(result, "");
		});
	});

	describe("Generator - Loop Nodes", () => {
		it("should iterate over an array and render the children for each item", () => {
			const ast: ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "item" }],
					iterator: "item",
					type: "for",
					value: "items",
				},
			];
			const context = { items: ["A", "B", "C"] };
			const result = generator.generate(ast, context);
			assert.strictEqual(result, "ABC");
		});

		it("should render nothing for an empty array", () => {
			const ast: ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "item" }],
					iterator: "item",
					type: "for",
					value: "items",
				},
			];
			const context = { items: [] };
			const result = generator.generate(ast, context);
			assert.strictEqual(result, "");
		});

		it("should render nothing for non-array values", () => {
			const ast: ASTNode[] = [
				{
					children: [{ children: [], type: "variable", value: "item" }],
					iterator: "item",
					type: "for",
					value: "items",
				},
			];
			const context = { items: null };
			const result = generator.generate(ast, context);
			assert.strictEqual(result, "");
		});
	});
});
