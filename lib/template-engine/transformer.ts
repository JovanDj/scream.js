import type { BlockNode, TemplateASTNode } from "./ast.js";
import type { FileLoader } from "./file-loader.js";
import type { Parser } from "./parser.js";
import { TemplateSyntaxError } from "./template-syntax-error.js";
import type { Tokenizer } from "./tokenizer.js";

export class Transformer {
	readonly #fileLoader: FileLoader;
	readonly #tokenizer: Tokenizer;
	readonly #parser: Parser;

	constructor(fileLoader: FileLoader, tokenizer: Tokenizer, parser: Parser) {
		this.#fileLoader = fileLoader;
		this.#tokenizer = tokenizer;
		this.#parser = parser;
	}

	transform(ast: readonly TemplateASTNode[]): readonly TemplateASTNode[] {
		return this.#transform(ast, []);
	}

	#transform(
		ast: readonly TemplateASTNode[],
		chain: readonly string[],
	): readonly TemplateASTNode[] {
		this.#assertNoNestedExtends(ast);
		const extendsNodes = ast.filter((node) => node.type === "extends");
		const extendsNode = extendsNodes[0];

		if (!extendsNode) {
			this.#assertUniqueBlocks(ast);
			return ast;
		}

		if (extendsNodes.length > 1) {
			throw new TemplateSyntaxError(
				"Templates may contain at most one extends directive",
				{ span: extendsNodes[1]?.span ?? extendsNode.span },
			);
		}

		const firstMeaningfulNode = ast.find((node) => {
			return node.type !== "text" || node.value.trim() !== "";
		});

		if (firstMeaningfulNode !== extendsNode) {
			throw new TemplateSyntaxError(
				"Extends must be the first meaningful directive",
				{ span: extendsNode.span },
			);
		}

		if (chain.includes(extendsNode.template)) {
			throw new TemplateSyntaxError(
				`Cyclic extends detected: ${[...chain, extendsNode.template].join(" -> ")}`,
				{ span: extendsNode.span },
			);
		}

		this.#assertExtendingTemplateShape(ast);
		const childBlocks = ast.filter((node) => node.type === "block");
		this.#assertUniqueDirectBlocks(childBlocks);

		const resolvedParent = this.#loadAndTransformParent(extendsNode, chain);
		const parentBlockNames = this.#collectBlockNames(resolvedParent);

		for (const childBlock of childBlocks) {
			if (!parentBlockNames.includes(childBlock.name)) {
				throw new TemplateSyntaxError(
					`Unknown template block: ${childBlock.name}`,
					{ span: childBlock.span },
				);
			}
		}

		return this.#mergeBlocks(resolvedParent, childBlocks);
	}

	#loadAndTransformParent(
		extendsNode: Extract<TemplateASTNode, { type: "extends" }>,
		chain: readonly string[],
	) {
		try {
			const parentSource = this.#fileLoader.loadView(extendsNode.template);
			const parentAst = this.#parser.parse(
				this.#tokenizer.tokenize(parentSource),
			);
			return this.#transform(parentAst, [...chain, extendsNode.template]);
		} catch (error) {
			if (
				error instanceof TemplateSyntaxError &&
				error.viewName === undefined
			) {
				throw new TemplateSyntaxError(error.syntaxMessage, {
					...(error.span === undefined ? {} : { span: error.span }),
					viewName: extendsNode.template,
				});
			}

			throw error;
		}
	}

	#assertNoNestedExtends(ast: readonly TemplateASTNode[]) {
		for (const node of ast) {
			if (node.type === "block") {
				this.#assertNoExtendsInChildren(node.children);
			}

			if (node.type === "if") {
				this.#assertNoExtendsInChildren(node.children);
				this.#assertNoExtendsInChildren(node.alternate);
			}

			if (node.type === "for") {
				this.#assertNoExtendsInChildren(node.children);
			}
		}
	}

	#assertNoExtendsInChildren(nodes: readonly TemplateASTNode[]) {
		for (const node of nodes) {
			if (node.type === "extends") {
				throw new TemplateSyntaxError(
					"Extends directives are only allowed at the top level",
					{ span: node.span },
				);
			}

			if (node.type === "block") {
				this.#assertNoExtendsInChildren(node.children);
			}

			if (node.type === "if") {
				this.#assertNoExtendsInChildren(node.children);
				this.#assertNoExtendsInChildren(node.alternate);
			}

			if (node.type === "for") {
				this.#assertNoExtendsInChildren(node.children);
			}
		}
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
		for (const node of nodes) {
			if (node.type === "block") {
				throw new TemplateSyntaxError(
					"Nested template blocks are not allowed in extending templates",
					{ span: node.span },
				);
			}

			if (node.type === "if") {
				this.#assertNoNestedBlockOverrides(node.children);
				this.#assertNoNestedBlockOverrides(node.alternate);
			}

			if (node.type === "for") {
				this.#assertNoNestedBlockOverrides(node.children);
			}
		}
	}

	#assertUniqueDirectBlocks(blocks: readonly BlockNode[]) {
		const names: string[] = [];

		for (const block of blocks) {
			if (names.includes(block.name)) {
				throw new TemplateSyntaxError(
					`Duplicate template block: ${block.name}`,
					{
						span: block.span,
					},
				);
			}

			names.push(block.name);
		}
	}

	#assertUniqueBlocks(ast: readonly TemplateASTNode[]) {
		const names: string[] = [];

		for (const block of this.#collectBlocks(ast)) {
			if (names.includes(block.name)) {
				throw new TemplateSyntaxError(
					`Duplicate template block: ${block.name}`,
					{
						span: block.span,
					},
				);
			}

			names.push(block.name);
		}
	}

	#collectBlockNames(ast: readonly TemplateASTNode[]) {
		this.#assertUniqueBlocks(ast);
		return this.#collectBlocks(ast).map((block) => block.name);
	}

	#collectBlocks(ast: readonly TemplateASTNode[]): readonly BlockNode[] {
		return ast.flatMap((node): readonly BlockNode[] => {
			if (node.type === "block") {
				return [node, ...this.#collectBlocks(node.children)];
			}

			if (node.type === "if") {
				return [
					...this.#collectBlocks(node.children),
					...this.#collectBlocks(node.alternate),
				];
			}

			if (node.type === "for") {
				return this.#collectBlocks(node.children);
			}

			return [];
		});
	}

	#mergeBlocks(
		parentAst: readonly TemplateASTNode[],
		childBlocks: readonly BlockNode[],
	): readonly TemplateASTNode[] {
		return parentAst.map((node): TemplateASTNode => {
			if (node.type === "block") {
				const childBlock = childBlocks.find(
					(block) => block.name === node.name,
				);

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
		});
	}
}
