import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { InMemoryFileLoader } from "./in-memory-file-loader.js";
import { type ASTNode, Parser } from "./parser.js";
import { Resolver } from "./resolver.js";
import { Tokenizer } from "./tokenizer.js";
import { Transformer } from "./transformer.js";

describe("Resolver", () => {
	let fileLoader: InMemoryFileLoader;
	let tokenizer: Tokenizer;
	let parser: Parser;
	let transformer: Transformer;
	let resolver: Resolver;

	beforeEach(() => {
		fileLoader = new InMemoryFileLoader();
		tokenizer = new Tokenizer();
		parser = new Parser();
		transformer = new Transformer();
		resolver = new Resolver(fileLoader, tokenizer, parser, transformer);
	});

	it("resolves a template without inheritance", () => {
		const template = "<h1>Hello</h1>";
		const ast = resolver.resolve(template);

		assert.deepStrictEqual<ASTNode[]>(ast, [
			{ type: "text", value: "<h1>Hello</h1>", children: [] },
		]);
	});

	it("resolves a template with single-level inheritance and full block override", () => {
		fileLoader.setTemplate(
			"layout.html",
			`
        <header>{% block header %}Default Header{% endblock header %}</header>
        <main>{% block content %}Default Content{% endblock content %}</main>`,
		);

		const template = `{% extends "layout.html" %}
        {% block header %}Custom Header{% endblock header %}
        {% block content %}Custom Content{% endblock content %}`;

		const ast = resolver.resolve(template);

		assert.deepStrictEqual<ASTNode[]>(ast, [
			{
				type: "text",
				value: "\n        <header>",
				children: [],
			},
			{
				type: "block",
				value: "header",
				children: [
					{
						type: "text",
						value: "Custom Header",
						children: [],
					},
				],
			},
			{
				type: "text",
				value: "</header>\n        <main>",
				children: [],
			},
			{
				type: "block",
				value: "content",
				children: [
					{
						type: "text",
						value: "Custom Content",
						children: [],
					},
				],
			},
			{
				type: "text",
				value: "</main>",
				children: [],
			},
		]);
	});

	it("resolves nested inheritance with partial block override", () => {
		fileLoader.setTemplate(
			"base.html",
			`
        <header>{% block header %}Base Header{% endblock header %}</header>
        <main>{% block content %}Base Content{% endblock content %}</main>`,
		);

		fileLoader.setTemplate(
			"mid.html",
			`{% extends "base.html" %}
        {% block header %}Mid Header{% endblock header %}`,
		);

		const template = `{% extends "mid.html" %}
        {% block content %}Leaf Content{% endblock content %}`;

		const ast = resolver.resolve(template);

		assert.deepStrictEqual<ASTNode[]>(ast, [
			{
				type: "text",
				value: "\n        <header>",
				children: [],
			},
			{
				type: "block",
				value: "header",
				children: [{ type: "text", value: "Mid Header", children: [] }],
			},
			{
				type: "text",
				value: "</header>\n        <main>",
				children: [],
			},
			{
				type: "block",
				value: "content",
				children: [{ type: "text", value: "Leaf Content", children: [] }],
			},
			{ type: "text", value: "</main>", children: [] },
		]);
	});

	it("preserves default block content when not overridden", () => {
		fileLoader.setTemplate(
			"layout.html",
			`
        <nav>{% block nav %}Default Nav{% endblock nav %}</nav>`,
		);

		const template = `{% extends "layout.html" %}`;

		const ast = resolver.resolve(template);

		assert.deepStrictEqual<ASTNode[]>(ast, [
			{ type: "text", value: "\n        <nav>", children: [] },
			{
				type: "block",
				value: "nav",
				children: [{ type: "text", value: "Default Nav", children: [] }],
			},
			{ type: "text", value: "</nav>", children: [] },
		]);
	});

	it("throws on cyclic inheritance", () => {
		fileLoader.setTemplate("a.html", `{% extends "b.html" %}`);
		fileLoader.setTemplate("b.html", `{% extends "a.html" %}`);

		assert.throws(
			() => resolver.resolve(`{% extends "a.html" %}`),
			/ cyclic extends /i,
		);
	});
});
