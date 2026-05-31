import { beforeEach, describe, it, type TestContext } from "node:test";

import type { TemplateASTNode } from "./ast.js";
import { InMemoryFileLoader } from "./in-memory-file-loader.js";
import { Parser } from "./parser.js";
import { Tokenizer } from "./tokenizer.js";
import { Transformer } from "./transformer.js";

describe("Transformer", { concurrency: true }, () => {
	let fileLoader: InMemoryFileLoader;
	let transformer: Transformer;

	beforeEach(() => {
		fileLoader = new InMemoryFileLoader();
		const tokenizer = new Tokenizer();
		const parser = new Parser();
		transformer = new Transformer(fileLoader, tokenizer, parser);
	});

	describe("typed AST transformation", () => {
		it("preserves adjacent text nodes without normalization", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{ span: { end: 5, start: 0 }, type: "text", value: "Hello" },
				{ span: { end: 6, start: 5 }, type: "text", value: " " },
				{ span: { end: 11, start: 6 }, type: "text", value: "World" },
			];

			const result = transformer.transform(ast);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{ span: { end: 5, start: 0 }, type: "text", value: "Hello" },
				{ span: { end: 6, start: 5 }, type: "text", value: " " },
				{ span: { end: 11, start: 6 }, type: "text", value: "World" },
			]);
		});

		it("preserves runtime if nodes without branch pruning", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					alternate: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Fallback" },
					],
					children: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Visible" },
					],
					condition: {
						segments: ["cond"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "if",
				},
			];

			const result = transformer.transform(ast);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					alternate: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Fallback" },
					],
					children: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Visible" },
					],
					condition: {
						segments: ["cond"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "if",
				},
			]);
		});

		it("preserves runtime for nodes without loop expansion", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{
							expression: {
								segments: ["item"],
								span: { end: 0, start: 0 },
								type: "path",
							},
							span: { end: 0, start: 0 },
							type: "variable",
						},
					],
					collection: {
						segments: ["items"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					iterator: "item",
					span: { end: 0, start: 0 },
					type: "for",
				},
			];

			const result = transformer.transform(ast);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					children: [
						{
							expression: {
								segments: ["item"],
								span: { end: 0, start: 0 },
								type: "path",
							},
							span: { end: 0, start: 0 },
							type: "variable",
						},
					],
					collection: {
						segments: ["items"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					iterator: "item",
					span: { end: 0, start: 0 },
					type: "for",
				},
			]);
		});

		it("preserves block nodes without inheritance", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Content" },
					],
					name: "content",
					span: { end: 0, start: 0 },
					type: "block",
				},
			];

			const result = transformer.transform(ast);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					children: [
						{ span: { end: 0, start: 0 }, type: "text", value: "Content" },
					],
					name: "content",
					span: { end: 0, start: 0 },
					type: "block",
				},
			]);
		});
	});

	describe("layout transformation", () => {
		it("resolves a template with single-level inheritance and full block override", (t: TestContext) => {
			t.plan(1);
			fileLoader.setTemplate(
				"layout.scream",
				`<main>{% block content %}Default{% endblock %}</main>`,
			);
			const ast: readonly TemplateASTNode[] = [
				{
					span: { end: 27, start: 0 },
					template: "layout.scream",
					type: "extends",
				},
				{
					children: [
						{ span: { end: 51, start: 46 }, type: "text", value: "Child" },
					],
					name: "content",
					span: { end: 65, start: 27 },
					type: "block",
				},
			];

			const result = transformer.transform(ast);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{ span: { end: 6, start: 0 }, type: "text", value: "<main>" },
				{
					children: [
						{ span: { end: 51, start: 46 }, type: "text", value: "Child" },
					],
					name: "content",
					span: { end: 46, start: 6 },
					type: "block",
				},
				{ span: { end: 53, start: 46 }, type: "text", value: "</main>" },
			]);
		});

		it("preserves default block content when not overridden", (t: TestContext) => {
			t.plan(1);
			fileLoader.setTemplate(
				"layout.scream",
				`{% block header %}Default Header{% endblock header %}
{% block content %}Default Content{% endblock content %}`,
			);
			const ast: readonly TemplateASTNode[] = [
				{
					span: { end: 27, start: 0 },
					template: "layout.scream",
					type: "extends",
				},
				{
					children: [
						{ span: { end: 51, start: 46 }, type: "text", value: "Child" },
					],
					name: "content",
					span: { end: 65, start: 27 },
					type: "block",
				},
			];

			const result = transformer.transform(ast);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{
					children: [
						{
							span: { end: 32, start: 18 },
							type: "text",
							value: "Default Header",
						},
					],
					name: "header",
					span: { end: 53, start: 0 },
					type: "block",
				},
				{ span: { end: 54, start: 53 }, type: "text", value: "\n" },
				{
					children: [
						{ span: { end: 51, start: 46 }, type: "text", value: "Child" },
					],
					name: "content",
					span: { end: 110, start: 54 },
					type: "block",
				},
			]);
		});

		it("resolves nested inheritance with partial block override", (t: TestContext) => {
			t.plan(1);
			fileLoader.setTemplate(
				"base.scream",
				`<header>{% block header %}Default Header{% endblock %}</header><main>{% block content %}Default Content{% endblock %}</main>`,
			);
			fileLoader.setTemplate(
				"mid.scream",
				`{% extends "base.scream" %}{% block header %}Mid Header{% endblock %}`,
			);
			const ast: readonly TemplateASTNode[] = [
				{
					span: { end: 24, start: 0 },
					template: "mid.scream",
					type: "extends",
				},
				{
					children: [
						{
							span: { end: 55, start: 43 },
							type: "text",
							value: "Leaf Content",
						},
					],
					name: "content",
					span: { end: 69, start: 24 },
					type: "block",
				},
			];

			const result = transformer.transform(ast);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{ span: { end: 8, start: 0 }, type: "text", value: "<header>" },
				{
					children: [
						{ span: { end: 55, start: 45 }, type: "text", value: "Mid Header" },
					],
					name: "header",
					span: { end: 54, start: 8 },
					type: "block",
				},
				{
					span: { end: 69, start: 54 },
					type: "text",
					value: "</header><main>",
				},
				{
					children: [
						{
							span: { end: 55, start: 43 },
							type: "text",
							value: "Leaf Content",
						},
					],
					name: "content",
					span: { end: 117, start: 69 },
					type: "block",
				},
				{ span: { end: 124, start: 117 }, type: "text", value: "</main>" },
			]);
		});

		it("resolves multi-level inheritance", (t: TestContext) => {
			t.plan(1);
			fileLoader.setTemplate(
				"base.scream",
				`<main>{% block content %}Base{% endblock %}</main>`,
			);
			fileLoader.setTemplate(
				"level1.scream",
				`{% extends "base.scream" %}{% block content %}Level1{% endblock %}`,
			);
			fileLoader.setTemplate(
				"level2.scream",
				`{% extends "level1.scream" %}{% block content %}Level2{% endblock %}`,
			);
			const ast: readonly TemplateASTNode[] = [
				{
					span: { end: 27, start: 0 },
					template: "level2.scream",
					type: "extends",
				},
				{
					children: [
						{ span: { end: 52, start: 46 }, type: "text", value: "Level3" },
					],
					name: "content",
					span: { end: 66, start: 27 },
					type: "block",
				},
			];

			const result = transformer.transform(ast);

			t.assert.deepStrictEqual<readonly TemplateASTNode[]>(result, [
				{ span: { end: 6, start: 0 }, type: "text", value: "<main>" },
				{
					children: [
						{ span: { end: 52, start: 46 }, type: "text", value: "Level3" },
					],
					name: "content",
					span: { end: 43, start: 6 },
					type: "block",
				},
				{ span: { end: 50, start: 43 }, type: "text", value: "</main>" },
			]);
		});

		it("throws when a child overrides an unknown block", (t: TestContext) => {
			t.plan(1);
			fileLoader.setTemplate(
				"layout.scream",
				`<main>{% block content %}Default{% endblock %}</main>`,
			);
			const ast: readonly TemplateASTNode[] = [
				{
					span: { end: 27, start: 0 },
					template: "layout.scream",
					type: "extends",
				},
				{
					children: [
						{ span: { end: 51, start: 46 }, type: "text", value: "Child" },
					],
					name: "sidebar",
					span: { end: 65, start: 27 },
					type: "block",
				},
			];

			const act = () => transformer.transform(ast);

			t.assert.throws(act, /Unknown template block: sidebar/);
		});

		it("throws when a child overrides the same block twice", (t: TestContext) => {
			t.plan(1);
			fileLoader.setTemplate(
				"layout.scream",
				`<main>{% block content %}Default{% endblock %}</main>`,
			);
			const ast: readonly TemplateASTNode[] = [
				{
					span: { end: 27, start: 0 },
					template: "layout.scream",
					type: "extends",
				},
				{
					children: [{ span: { end: 1, start: 0 }, type: "text", value: "A" }],
					name: "content",
					span: { end: 2, start: 1 },
					type: "block",
				},
				{
					children: [{ span: { end: 3, start: 2 }, type: "text", value: "B" }],
					name: "content",
					span: { end: 4, start: 3 },
					type: "block",
				},
			];

			const act = () => transformer.transform(ast);

			t.assert.throws(act, /Duplicate template block: content/);
		});

		it("throws when a parent defines the same block twice", (t: TestContext) => {
			t.plan(1);
			fileLoader.setTemplate(
				"layout.scream",
				`{% block content %}One{% endblock %}{% block content %}Two{% endblock %}`,
			);
			const ast: readonly TemplateASTNode[] = [
				{
					span: { end: 27, start: 0 },
					template: "layout.scream",
					type: "extends",
				},
				{
					children: [
						{ span: { end: 51, start: 46 }, type: "text", value: "Child" },
					],
					name: "content",
					span: { end: 65, start: 27 },
					type: "block",
				},
			];

			const act = () => transformer.transform(ast);

			t.assert.throws(act, /Duplicate template block: content/);
		});

		it("throws when extends is not the first meaningful directive", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{ span: { end: 1, start: 0 }, type: "text", value: "x" },
				{
					span: { end: 27, start: 1 },
					template: "layout.scream",
					type: "extends",
				},
			];

			const act = () => transformer.transform(ast);

			t.assert.throws(act, /Extends must be the first meaningful directive/);
		});

		it("throws when an extending template has content outside blocks", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					span: { end: 27, start: 0 },
					template: "layout.scream",
					type: "extends",
				},
				{ span: { end: 28, start: 27 }, type: "text", value: "x" },
			];

			const act = () => transformer.transform(ast);

			t.assert.throws(
				act,
				/Templates with extends may only define blocks outside whitespace/,
			);
		});

		it("throws when an extending template defines a nested block", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					span: { end: 27, start: 0 },
					template: "layout.scream",
					type: "extends",
				},
				{
					children: [
						{
							children: [],
							name: "nested",
							span: { end: 2, start: 1 },
							type: "block",
						},
					],
					name: "content",
					span: { end: 65, start: 27 },
					type: "block",
				},
			];

			const act = () => transformer.transform(ast);

			t.assert.throws(
				act,
				/Nested template blocks are not allowed in extending templates/,
			);
		});

		it("throws when extends appears inside a conditional", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					alternate: [],
					children: [
						{
							span: { end: 30, start: 5 },
							template: "layout.scream",
							type: "extends",
						},
					],
					condition: {
						segments: ["condition"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					span: { end: 0, start: 0 },
					type: "if",
				},
			];

			const act = () => transformer.transform(ast);

			t.assert.throws(
				act,
				/Extends directives are only allowed at the top level/,
			);
		});

		it("throws when extends appears inside a loop", (t: TestContext) => {
			t.plan(1);
			const ast: readonly TemplateASTNode[] = [
				{
					children: [
						{
							span: { end: 30, start: 5 },
							template: "layout.scream",
							type: "extends",
						},
					],
					collection: {
						segments: ["items"],
						span: { end: 0, start: 0 },
						type: "path",
					},
					iterator: "item",
					span: { end: 0, start: 0 },
					type: "for",
				},
			];

			const act = () => transformer.transform(ast);

			t.assert.throws(
				act,
				/Extends directives are only allowed at the top level/,
			);
		});

		it("throws on cyclic inheritance", (t: TestContext) => {
			t.plan(1);
			fileLoader.setTemplate("a.scream", `{% extends "b.scream" %}`);
			fileLoader.setTemplate("b.scream", `{% extends "a.scream" %}`);
			const ast: readonly TemplateASTNode[] = [
				{
					span: { end: 22, start: 0 },
					template: "a.scream",
					type: "extends",
				},
			];

			const act = () => transformer.transform(ast);

			t.assert.throws(act, /Cyclic extends detected/);
		});
	});
});
