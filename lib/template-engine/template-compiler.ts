import type { BlockNode, TemplateASTNode } from "./ast.js";
import type { FileLoader } from "./file-loader.js";
import type { Parser } from "./parser.js";
import { TemplateSyntaxError } from "./template-syntax-error.js";
import type { Tokenizer } from "./tokenizer.js";

export class TemplateCompiler {
	readonly #fileLoader: FileLoader;
	readonly #tokenizer: Tokenizer;
	readonly #parser: Parser;

	constructor(fileLoader: FileLoader, tokenizer: Tokenizer, parser: Parser) {
		this.#fileLoader = fileLoader;
		this.#tokenizer = tokenizer;
		this.#parser = parser;
	}

	compile(template: string): readonly TemplateASTNode[] {
		return this.#compileSource(template, []);
	}

	compileView(viewName: string): readonly TemplateASTNode[] {
		return this.#compileNamedView(viewName, [viewName]);
	}

	#compileNamedView(
		viewName: string,
		chain: readonly string[],
	): readonly TemplateASTNode[] {
		try {
			const template = this.#fileLoader.loadView(viewName);

			return this.#compileSource(template, chain);
		} catch (error) {
			if (
				error instanceof TemplateSyntaxError &&
				error.viewName === undefined
			) {
				throw new TemplateSyntaxError(error.syntaxMessage, {
					...(!error.span ? {} : { span: error.span }),
					viewName,
				});
			}

			throw error;
		}
	}

	#compileSource(
		template: string,
		chain: readonly string[],
	): readonly TemplateASTNode[] {
		const tokens = this.#tokenizer.tokenize(template);
		const ast = this.#parser.parse(tokens);

		return this.#resolveLayoutInheritance(ast, chain);
	}

	#resolveLayoutInheritance(
		ast: readonly TemplateASTNode[],
		chain: readonly string[],
	): readonly TemplateASTNode[] {
		this.#assertNoNestedExtends(ast);
		const extendsNode = this.#findExtendsNode(ast);

		if (!extendsNode) {
			this.#indexBlocks(ast);
			return ast;
		}

		this.#assertSingleExtends(ast, extendsNode);
		this.#assertExtendsIsFirstMeaningfulNode(ast, extendsNode);
		this.#assertNoLayoutCycle(chain, extendsNode);
		this.#assertExtendingTemplateShape(ast);

		const childBlocks = this.#indexDirectChildBlocks(ast);
		const resolvedParent = this.#compileNamedView(extendsNode.template, [
			...chain,
			extendsNode.template,
		]);
		const parentBlocks = this.#indexBlocks(resolvedParent);
		this.#assertKnownChildBlocks(childBlocks, parentBlocks);

		return this.#mergeBlocks(resolvedParent, childBlocks);
	}

	#findExtendsNode(ast: readonly TemplateASTNode[]) {
		return ast.find((node) => {
			return node.type === "extends";
		});
	}

	#assertSingleExtends(
		ast: readonly TemplateASTNode[],
		extendsNode: Extract<TemplateASTNode, { type: "extends" }>,
	) {
		const extendsNodes = ast.filter((node) => {
			return node.type === "extends";
		});

		if (extendsNodes.length > 1) {
			throw new TemplateSyntaxError(
				"Templates may contain at most one extends directive",
				{ span: extendsNodes[1]?.span ?? extendsNode.span },
			);
		}
	}

	#assertExtendsIsFirstMeaningfulNode(
		ast: readonly TemplateASTNode[],
		extendsNode: Extract<TemplateASTNode, { type: "extends" }>,
	) {
		const firstMeaningfulNode = ast.find((node) => {
			return node.type !== "text" || node.value.trim() !== "";
		});

		if (firstMeaningfulNode !== extendsNode) {
			throw new TemplateSyntaxError(
				"Extends must be the first meaningful directive",
				{ span: extendsNode.span },
			);
		}
	}

	#assertNoLayoutCycle(
		chain: readonly string[],
		extendsNode: Extract<TemplateASTNode, { type: "extends" }>,
	) {
		if (chain.includes(extendsNode.template)) {
			throw new TemplateSyntaxError(
				`Cyclic extends detected: ${[...chain, extendsNode.template].join(" -> ")}`,
				{ span: extendsNode.span },
			);
		}
	}

	#assertNoNestedExtends(ast: readonly TemplateASTNode[]) {
		for (const node of ast) {
			this.#assertNoNestedExtendsInNode(node);
		}
	}

	#assertNoNestedExtendsInNode(node: TemplateASTNode) {
		if (node.type === "block") {
			this.#assertNoExtends(node.children);
			return;
		}

		if (node.type === "if") {
			this.#assertNoExtends(node.children);
			this.#assertNoExtends(node.alternate);
			return;
		}

		if (node.type === "for") {
			this.#assertNoExtends(node.children);
			return;
		}
	}

	#assertNoExtends(nodes: readonly TemplateASTNode[]) {
		this.#walkNodes(nodes, (node) => {
			if (node.type === "extends") {
				throw new TemplateSyntaxError(
					"Extends directives are only allowed at the top level",
					{ span: node.span },
				);
			}
		});
	}

	#assertExtendingTemplateShape(ast: readonly TemplateASTNode[]) {
		for (const node of ast) {
			if (node.type === "text" && node.value.trim() === "") {
				continue;
			}

			if (node.type === "extends") {
				continue;
			}

			if (node.type === "block") {
				this.#assertNoNestedBlockOverrides(node.children);
				continue;
			}

			throw new TemplateSyntaxError(
				"Templates with extends may only define blocks outside whitespace",
				{ span: node.span },
			);
		}
	}

	#assertNoNestedBlockOverrides(nodes: readonly TemplateASTNode[]) {
		this.#walkNodes(nodes, (node) => {
			if (node.type === "block") {
				throw new TemplateSyntaxError(
					"Nested template blocks are not allowed in extending templates",
					{ span: node.span },
				);
			}
		});
	}

	#walkNodes(
		nodes: readonly TemplateASTNode[],
		visit: (node: TemplateASTNode) => void,
	) {
		for (const node of nodes) {
			visit(node);
			this.#walkNodeChildren(node, visit);
		}
	}

	#walkNodeChildren(
		node: TemplateASTNode,
		visit: (node: TemplateASTNode) => void,
	) {
		if (node.type === "block") {
			this.#walkNodes(node.children, visit);
			return;
		}

		if (node.type === "if") {
			this.#walkNodes(node.children, visit);
			this.#walkNodes(node.alternate, visit);
			return;
		}

		if (node.type === "for") {
			this.#walkNodes(node.children, visit);
			return;
		}
	}

	#indexDirectChildBlocks(
		ast: readonly TemplateASTNode[],
	): readonly BlockNode[] {
		const blocks: BlockNode[] = [];

		for (const node of ast) {
			if (node.type !== "block") {
				continue;
			}

			if (this.#hasBlock(blocks, node.name)) {
				throw new TemplateSyntaxError(
					`Duplicate template block: ${node.name}`,
					{
						span: node.span,
					},
				);
			}

			blocks.push(node);
		}

		return blocks;
	}

	#indexBlocks(ast: readonly TemplateASTNode[]): readonly BlockNode[] {
		const blocks: BlockNode[] = [];

		this.#walkNodes(ast, (node) => {
			if (node.type !== "block") {
				return;
			}

			if (this.#hasBlock(blocks, node.name)) {
				throw new TemplateSyntaxError(
					`Duplicate template block: ${node.name}`,
					{
						span: node.span,
					},
				);
			}

			blocks.push(node);
		});

		return blocks;
	}

	#assertKnownChildBlocks(
		childBlocks: readonly BlockNode[],
		parentBlocks: readonly BlockNode[],
	) {
		for (const childBlock of childBlocks) {
			if (!this.#hasBlock(parentBlocks, childBlock.name)) {
				throw new TemplateSyntaxError(
					`Unknown template block: ${childBlock.name}`,
					{ span: childBlock.span },
				);
			}
		}
	}

	#findBlock(blocks: readonly BlockNode[], name: string) {
		return blocks.find((block) => {
			return block.name === name;
		});
	}

	#hasBlock(blocks: readonly BlockNode[], name: string) {
		return this.#findBlock(blocks, name) !== undefined;
	}

	#mergeBlocks(
		parentAst: readonly TemplateASTNode[],
		childBlocks: readonly BlockNode[],
	): readonly TemplateASTNode[] {
		return parentAst.map((node) => this.#mergeNode(node, childBlocks));
	}

	#mergeNode(
		node: TemplateASTNode,
		childBlocks: readonly BlockNode[],
	): TemplateASTNode {
		if (node.type === "block") {
			return this.#mergeBlockNode(node, childBlocks);
		}

		if (node.type === "if") {
			return {
				...node,
				alternate: this.#mergeBlocks(node.alternate, childBlocks),
				children: this.#mergeBlocks(node.children, childBlocks),
			};
		}

		if (node.type === "for") {
			return {
				...node,
				children: this.#mergeBlocks(node.children, childBlocks),
			};
		}

		return node;
	}

	#mergeBlockNode(
		node: BlockNode,
		childBlocks: readonly BlockNode[],
	): TemplateASTNode {
		const childBlock = this.#findBlock(childBlocks, node.name);

		if (childBlock) {
			return {
				...node,
				children: childBlock.children,
			};
		}

		return {
			...node,
			children: this.#mergeBlocks(node.children, childBlocks),
		};
	}
}
