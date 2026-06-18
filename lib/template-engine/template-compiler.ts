import type { BlockNode, TemplateASTNode } from "./ast.js";
import type { FileLoader } from "./file-loader.js";
import type { Parser } from "./parser.js";
import {
	type SourceSpan,
	TemplateSyntaxError,
} from "./template-syntax-error.js";
import type { Tokenizer } from "./tokenizer.js";

type AttributeValuePart =
	| {
			readonly type: "literal";
			readonly value: string;
			readonly span: SourceSpan;
	  }
	| {
			readonly type: "variable";
			readonly span: SourceSpan;
	  };

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
		includeChain: readonly string[] = [],
	): readonly TemplateASTNode[] {
		const tokens = this.#tokenizer.tokenize(template);
		const ast = this.#parser.parse(tokens);
		const resolvedIncludes = this.#resolveIncludes(ast, includeChain);
		this.#assertValidUrlAttributes(resolvedIncludes);

		return this.#resolveLayoutInheritance(resolvedIncludes, chain);
	}

	#resolveIncludes(
		nodes: readonly TemplateASTNode[],
		includeChain: readonly string[],
	): readonly TemplateASTNode[] {
		return nodes.flatMap((node) =>
			this.#resolveIncludeNode(node, includeChain),
		);
	}

	#resolveIncludeNode(
		node: TemplateASTNode,
		includeChain: readonly string[],
	): readonly TemplateASTNode[] {
		if (node.type === "include") {
			return this.#compileIncludedView(node.template, includeChain, node.span);
		}

		if (node.type === "block") {
			return [
				{
					...node,
					children: this.#resolveIncludes(node.children, includeChain),
				},
			];
		}

		if (node.type === "if") {
			return [
				{
					...node,
					alternate: this.#resolveIncludes(node.alternate, includeChain),
					children: this.#resolveIncludes(node.children, includeChain),
				},
			];
		}

		if (node.type === "apply") {
			return [
				{
					...node,
					children: this.#resolveIncludes(node.children, includeChain),
				},
			];
		}

		if (node.type === "template") {
			return [
				{
					...node,
					children: this.#resolveIncludes(node.children, includeChain),
				},
			];
		}

		return [node];
	}

	#compileIncludedView(
		viewName: string,
		includeChain: readonly string[],
		span: SourceSpan,
	): readonly TemplateASTNode[] {
		this.#assertValidIncludePath(viewName, span);
		this.#assertNoIncludeCycle(viewName, includeChain, span);

		try {
			const template = this.#fileLoader.loadView(viewName);
			const tokens = this.#tokenizer.tokenize(template);
			const ast = this.#parser.parse(tokens);
			const resolvedIncludes = this.#resolveIncludes(ast, [
				...includeChain,
				viewName,
			]);
			this.#assertIncludedTemplateShape(resolvedIncludes);

			return resolvedIncludes;
		} catch (error) {
			if (error instanceof TemplateSyntaxError) {
				if (error.viewName === undefined) {
					throw new TemplateSyntaxError(error.syntaxMessage, {
						...(!error.span ? {} : { span: error.span }),
						viewName,
					});
				}

				throw error;
			}

			if (error instanceof Error) {
				throw new TemplateSyntaxError(`Template not found: ${viewName}`, {
					span,
				});
			}

			throw error;
		}
	}

	#assertValidIncludePath(viewName: string, span: SourceSpan) {
		const normalizedViewName = viewName.replaceAll("\\", "/");

		if (!normalizedViewName.endsWith(".scream")) {
			throw new TemplateSyntaxError(
				"Included templates must use the .scream extension",
				{ span },
			);
		}

		if (
			viewName.includes(":") ||
			viewName.includes("\\") ||
			normalizedViewName.startsWith("/") ||
			normalizedViewName.startsWith("./") ||
			normalizedViewName.startsWith("../") ||
			normalizedViewName.includes("/./") ||
			normalizedViewName.includes("/../")
		) {
			throw new TemplateSyntaxError(`Invalid include path: ${viewName}`, {
				span,
			});
		}
	}

	#assertNoIncludeCycle(
		viewName: string,
		includeChain: readonly string[],
		span: SourceSpan,
	) {
		if (includeChain.includes(viewName)) {
			throw new TemplateSyntaxError(
				`Cyclic include detected: ${[...includeChain, viewName].join(" -> ")}`,
				{ span },
			);
		}
	}

	#assertIncludedTemplateShape(nodes: readonly TemplateASTNode[]) {
		this.#walkNodes(nodes, (node) => {
			if (node.type === "extends") {
				throw new TemplateSyntaxError(
					"Included templates cannot contain extends directives",
					{ span: node.span },
				);
			}

			if (node.type === "block") {
				throw new TemplateSyntaxError(
					"Included templates cannot contain block directives",
					{ span: node.span },
				);
			}
		});
	}

	#assertValidUrlAttributes(ast: readonly TemplateASTNode[]) {
		this.#assertValidUrlAttributesInNodes(ast);
	}

	#assertValidUrlAttributesInNodes(nodes: readonly TemplateASTNode[]) {
		for (let index = 0; index < nodes.length; index++) {
			const node = nodes[index];

			if (node?.type === "text") {
				this.#assertValidUrlAttributesInText(nodes, index, node);
			}

			if (node) {
				this.#assertValidUrlAttributesInChildren(node);
			}
		}
	}

	#assertValidUrlAttributesInText(
		nodes: readonly TemplateASTNode[],
		index: number,
		node: Extract<TemplateASTNode, { type: "text" }>,
	) {
		for (const match of node.value.matchAll(
			/(^|[\s<])(?:action|cite|formaction|href|manifest|poster|src|srcset)\s*=\s*(["'])/gi,
		)) {
			const prefix = match[1];
			const quote = match[2];

			if (
				prefix === undefined ||
				quote === undefined ||
				match.index === undefined
			) {
				continue;
			}

			const attributeStart = match.index + prefix.length;
			const valueStart = match.index + match[0].length;

			this.#assertRouteUrlAttributeValue({
				attributeSpan: {
					end: node.span.start + valueStart,
					start: node.span.start + attributeStart,
				},
				nodes,
				quote,
				textIndex: valueStart,
				textNode: node,
				textNodeIndex: index,
			});
		}

		for (const match of node.value.matchAll(
			/(^|[\s<])(?:action|cite|formaction|href|manifest|poster|src|srcset)\s*=\s*(?!["'])/gi,
		)) {
			const prefix = match[1];

			if (prefix === undefined || match.index === undefined) {
				continue;
			}

			const attributeStart = match.index + prefix.length;
			const valueStart = match.index + match[0].length;

			this.#assertRouteUrlAttributeValue({
				attributeSpan: {
					end: node.span.start + valueStart,
					start: node.span.start + attributeStart,
				},
				nodes,
				textIndex: valueStart,
				textNode: node,
				textNodeIndex: index,
			});
		}
	}

	#assertRouteUrlAttributeValue(input: {
		readonly attributeSpan: SourceSpan;
		readonly nodes: readonly TemplateASTNode[];
		readonly quote?: string;
		readonly textIndex: number;
		readonly textNode: Extract<TemplateASTNode, { type: "text" }>;
		readonly textNodeIndex: number;
	}) {
		const parts = this.#readRouteUrlAttributeValue(input);
		const variableParts = parts.filter((part) => part.type === "variable");
		const literalParts = parts.filter((part) => part.type === "literal");
		const literalPart = literalParts.find((part) => part.value.length > 0);

		if (variableParts.length === 1 && literalPart === undefined) {
			return;
		}

		this.#throwInvalidUrlAttribute(
			literalPart?.span ?? variableParts[1]?.span ?? input.attributeSpan,
		);
	}

	#readRouteUrlAttributeValue(input: {
		readonly attributeSpan: SourceSpan;
		readonly nodes: readonly TemplateASTNode[];
		readonly quote?: string;
		readonly textIndex: number;
		readonly textNode: Extract<TemplateASTNode, { type: "text" }>;
		readonly textNodeIndex: number;
	}): readonly AttributeValuePart[] {
		const firstText = input.textNode.value.slice(input.textIndex);
		const firstCloseIndex = this.#findAttributeValueEnd(firstText, input.quote);
		const firstSpanStart = input.textNode.span.start + input.textIndex;

		if (firstCloseIndex !== -1) {
			return this.#literalAttributeParts(
				firstText.slice(0, firstCloseIndex),
				firstSpanStart,
			);
		}

		const parts: AttributeValuePart[] = [
			...this.#literalAttributeParts(firstText, firstSpanStart),
		];

		for (
			let index = input.textNodeIndex + 1;
			index < input.nodes.length;
			index++
		) {
			const node = input.nodes[index];

			if (node?.type === "variable") {
				parts.push({ span: node.span, type: "variable" });
				continue;
			}

			if (node?.type !== "text") {
				this.#throwInvalidUrlAttribute(node?.span ?? input.attributeSpan);
			}

			const closeIndex = this.#findAttributeValueEnd(node.value, input.quote);

			if (closeIndex === -1) {
				parts.push(...this.#literalAttributeParts(node.value, node.span.start));
				continue;
			}

			parts.push(
				...this.#literalAttributeParts(
					node.value.slice(0, closeIndex),
					node.span.start,
				),
			);
			return parts;
		}

		return parts;
	}

	#findAttributeValueEnd(value: string, quote?: string) {
		if (quote !== undefined) {
			return value.indexOf(quote);
		}

		const match = /[\s>]/.exec(value);

		return match?.index ?? -1;
	}

	#literalAttributeParts(
		value: string,
		start: number,
	): readonly AttributeValuePart[] {
		if (value.length === 0) {
			return [];
		}

		return [
			{
				span: { end: start + value.length, start },
				type: "literal",
				value,
			},
		];
	}

	#assertValidUrlAttributesInChildren(node: TemplateASTNode) {
		if (node.type === "block") {
			this.#assertValidUrlAttributesInNodes(node.children);
			return;
		}

		if (node.type === "if") {
			this.#assertValidUrlAttributesInNodes(node.children);
			this.#assertValidUrlAttributesInNodes(node.alternate);
			return;
		}

		if (node.type === "apply") {
			this.#assertValidUrlAttributesInNodes(node.children);
			return;
		}

		if (node.type === "template") {
			this.#assertValidUrlAttributesInNodes(node.children);
		}
	}

	#throwInvalidUrlAttribute(span: SourceSpan): never {
		throw new TemplateSyntaxError(
			"URL attributes must use one complete attribute reference",
			{ span },
		);
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

		if (node.type === "apply") {
			this.#assertNoExtends(node.children);
			return;
		}

		if (node.type === "template") {
			this.#assertNoExtends(node.children);
			return;
		}

		if (node.type === "include") {
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

		if (node.type === "apply") {
			this.#walkNodes(node.children, visit);
			return;
		}

		if (node.type === "template") {
			this.#walkNodes(node.children, visit);
			return;
		}

		if (node.type === "include") {
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

		if (node.type === "apply") {
			return {
				...node,
				children: this.#mergeBlocks(node.children, childBlocks),
			};
		}

		if (node.type === "template") {
			return {
				...node,
				children: this.#mergeBlocks(node.children, childBlocks),
			};
		}

		if (node.type === "include") {
			return node;
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
