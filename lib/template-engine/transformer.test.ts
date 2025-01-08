import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { InMemoryFileLoader } from "./in-memory-file-loader.js";
import { type ASTNode, Parser } from "./parser.js";
import { Tokenizer } from "./tokenizer.js";
import { Transformer } from "./transformer.js";

describe("Transformer: Block Replacement", () => {
	let loader: InMemoryFileLoader;
	let tokenizer: Tokenizer;
	let parser: Parser;
	let transformer: Transformer;

	beforeEach(() => {
		loader = new InMemoryFileLoader();
		tokenizer = new Tokenizer();
		parser = new Parser();
		transformer = new Transformer(loader, tokenizer, parser);

		// Parent template
		loader.setTemplate(
			"layout",
			"<main>{% block content %}Default Content{% endblock content %}</main>",
		);
	});

	it("should replace blocks in the parent template with child content", () => {
		const childAST: ASTNode[] = [
			{ children: [], type: "extends", value: "layout" },
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "Child Content" },
				],
				type: "block",
				value: "content",
			},
		];

		const transformedAST = transformer.transform(childAST);

		const expectedAST: ASTNode[] = [
			{
				alternate: [],
				children: [],
				type: "text",
				value: "<main>",
			},
			{
				children: [
					{ alternate: [], children: [], type: "text", value: "Child Content" },
				],
				type: "block",
				value: "content",
			},
			{
				alternate: [],
				children: [],
				type: "text",
				value: "</main>",
			},
		];

		assert.deepStrictEqual(transformedAST, expectedAST);
	});

	it("should replace a single block in the parent template", () => {
		const childAST: ASTNode[] = [
			{ children: [], type: "extends", value: "layout" },
			{
				children: [{ children: [], type: "text", value: "Child Content" }],
				type: "block",
				value: "content",
			},
		];

		const transformedAST = transformer.transform(childAST);

		const expectedAST = [
			{ alternate: [], children: [], type: "text", value: "<main>" },
			{
				children: [{ children: [], type: "text", value: "Child Content" }],
				type: "block",
				value: "content",
			},
			{ alternate: [], children: [], type: "text", value: "</main>" },
		];

		assert.deepStrictEqual(transformedAST, expectedAST);
	});

	it("should retain default block content if not overridden", () => {
		const childAST: ASTNode[] = [
			{ children: [], type: "extends", value: "layout" },
		];

		const transformedAST = transformer.transform(childAST);

		const expectedAST: ASTNode[] = [
			{ alternate: [], children: [], type: "text", value: "<main>" },
			{
				children: [
					{
						alternate: [],
						children: [],
						type: "text",
						value: "Default Content",
					},
				],
				type: "block",
				value: "content",
			},
			{ alternate: [], children: [], type: "text", value: "</main>" },
		];

		assert.deepStrictEqual(transformedAST, expectedAST);
	});
});
