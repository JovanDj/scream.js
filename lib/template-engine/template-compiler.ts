import type {
	ApplyTemplateReference,
	BlockNode,
	TemplateASTNode,
	TemplateDefinitionNode,
	VariableNode,
} from "./ast.js";
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

type TemplateReferenceKind = "apply" | "include";
type RawTextTagName = "script" | "style";

type DynamicAttributeScanState =
	| { readonly mode: "text" }
	| { readonly mode: "rawText"; readonly tagName: RawTextTagName }
	| { readonly mode: "tag"; readonly rawTextTagName?: RawTextTagName }
	| { readonly mode: "afterEquals"; readonly rawTextTagName?: RawTextTagName }
	| {
			readonly mode: "unquotedAttributeValue";
			readonly rawTextTagName?: RawTextTagName;
	  }
	| {
			readonly mode: "quotedAttributeValue";
			readonly quote: '"' | "'";
			readonly rawTextTagName?: RawTextTagName;
	  };

type RendererPlacementResult = {
	readonly nodes: readonly TemplateASTNode[];
	readonly state: DynamicAttributeScanState;
};

type RendererPlacementNodeResult = {
	readonly node: TemplateASTNode;
	readonly state: DynamicAttributeScanState;
};

type RendererPlacementTemplateResult = {
	readonly state: DynamicAttributeScanState;
	readonly template: ApplyTemplateReference;
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

			return this.#compileSource(template, chain, [viewName]);
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
		referenceChain: readonly string[] = [],
	): readonly TemplateASTNode[] {
		const tokens = this.#tokenizer.tokenize(template);
		const ast = this.#parser.parse(tokens);
		const resolvedReferences = this.#resolveTemplateReferences(
			ast,
			referenceChain,
		);
		const composedAst = this.#resolveLayoutInheritance(
			resolvedReferences,
			chain,
		);
		const rendererReadyAst = this.#prepareRendererValuePlacements(composedAst);
		this.#assertValidUrlAttributes(rendererReadyAst);

		return rendererReadyAst;
	}

	#resolveTemplateReferences(
		nodes: readonly TemplateASTNode[],
		referenceChain: readonly string[],
	): readonly TemplateASTNode[] {
		return nodes.flatMap((node) =>
			this.#resolveTemplateReferenceNode(node, referenceChain),
		);
	}

	#resolveTemplateReferenceNode(
		node: TemplateASTNode,
		referenceChain: readonly string[],
	): readonly TemplateASTNode[] {
		if (node.type === "include") {
			const children = this.#compileReferencedView(
				node.template,
				referenceChain,
				node.span,
				"include",
			);

			return [
				{
					bindings: node.parameters ?? [],
					children,
					span: node.span,
					type: "scope",
				},
			];
		}

		if (node.type === "block") {
			return [
				{
					...node,
					children: this.#resolveTemplateReferences(
						node.children,
						referenceChain,
					),
				},
			];
		}

		if (node.type === "if") {
			return [
				{
					...node,
					alternate: this.#resolveTemplateReferences(
						node.alternate,
						referenceChain,
					),
					children: this.#resolveTemplateReferences(
						node.children,
						referenceChain,
					),
				},
			];
		}

		if (node.type === "apply") {
			return [
				{
					...node,
					children: this.#resolveTemplateReferences(
						node.children,
						referenceChain,
					),
					...(node.templates === undefined
						? {}
						: {
								templates: node.templates.map((template) =>
									this.#resolveApplyTemplateReference(template, referenceChain),
								),
							}),
					...(node.templateStages === undefined
						? {}
						: {
								templateStages: node.templateStages.map((stage) =>
									stage.map((template) =>
										this.#resolveApplyTemplateReference(
											template,
											referenceChain,
										),
									),
								),
							}),
				},
			];
		}

		if (node.type === "template") {
			return [
				{
					...node,
					children: this.#resolveTemplateReferences(
						node.children,
						referenceChain,
					),
				},
			];
		}

		if (node.type === "scope") {
			return [
				{
					...node,
					children: this.#resolveTemplateReferences(
						node.children,
						referenceChain,
					),
				},
			];
		}

		return [node];
	}

	#resolveApplyTemplateReference(
		reference: ApplyTemplateReference,
		referenceChain: readonly string[],
	): ApplyTemplateReference {
		if (reference.type === "namedTemplate") {
			return reference;
		}

		return {
			...reference,
			children: this.#compileReferencedView(
				reference.path,
				referenceChain,
				reference.span,
				"apply",
			),
		};
	}

	#compileReferencedView(
		viewName: string,
		referenceChain: readonly string[],
		span: SourceSpan,
		kind: TemplateReferenceKind,
	): readonly TemplateASTNode[] {
		this.#assertValidTemplateReferencePath(viewName, span, kind);
		this.#assertNoTemplateReferenceCycle(viewName, referenceChain, span);

		try {
			const template = this.#fileLoader.loadView(viewName);
			const tokens = this.#tokenizer.tokenize(template);
			const ast = this.#parser.parse(tokens);
			const resolvedReferences = this.#resolveTemplateReferences(ast, [
				...referenceChain,
				viewName,
			]);
			this.#assertReferencedTemplateShape(resolvedReferences, kind);

			return resolvedReferences;
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

	#assertValidTemplateReferencePath(
		viewName: string,
		span: SourceSpan,
		kind: TemplateReferenceKind,
	) {
		const normalizedViewName = viewName.replaceAll("\\", "/");

		if (!normalizedViewName.endsWith(".scream")) {
			throw new TemplateSyntaxError(
				kind === "include"
					? "Included templates must use the .scream extension"
					: "Applied templates must use the .scream extension",
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
			throw new TemplateSyntaxError(
				kind === "include"
					? `Invalid include path: ${viewName}`
					: `Invalid template path: ${viewName}`,
				{ span },
			);
		}
	}

	#assertNoTemplateReferenceCycle(
		viewName: string,
		referenceChain: readonly string[],
		span: SourceSpan,
	) {
		if (referenceChain.includes(viewName)) {
			throw new TemplateSyntaxError(
				`Cyclic template reference detected: ${[
					...referenceChain,
					viewName,
				].join(" -> ")}`,
				{ span },
			);
		}
	}

	#assertReferencedTemplateShape(
		nodes: readonly TemplateASTNode[],
		kind: TemplateReferenceKind,
	) {
		this.#walkNodes(nodes, (node) => {
			if (node.type === "extends") {
				throw new TemplateSyntaxError(
					kind === "include"
						? "Included templates cannot contain extends directives"
						: "Applied templates cannot contain extends directives",
					{ span: node.span },
				);
			}

			if (node.type === "block") {
				throw new TemplateSyntaxError(
					kind === "include"
						? "Included templates cannot contain block directives"
						: "Applied templates cannot contain block directives",
					{ span: node.span },
				);
			}

			if (node.type === "template") {
				throw new TemplateSyntaxError(
					kind === "include"
						? "Included templates cannot contain template definitions"
						: "Applied templates cannot contain template definitions",
					{ span: node.span },
				);
			}
		});
	}

	#assertValidUrlAttributes(ast: readonly TemplateASTNode[]) {
		this.#assertValidUrlAttributesInNodes(ast);
	}

	#prepareRendererValuePlacements(
		nodes: readonly TemplateASTNode[],
	): readonly TemplateASTNode[] {
		return this.#prepareRendererValuePlacementsFrom(
			nodes,
			{
				mode: "text",
			},
			this.#templateDefinitions(nodes),
		).nodes;
	}

	#templateDefinitions(
		nodes: readonly TemplateASTNode[],
	): ReadonlyMap<string, TemplateDefinitionNode> {
		const definitions = new Map<string, TemplateDefinitionNode>();

		this.#walkNodes(nodes, (node) => {
			if (node.type === "template" && !definitions.has(node.name)) {
				definitions.set(node.name, node);
			}
		});

		return definitions;
	}

	#prepareRendererValuePlacementsFrom(
		nodes: readonly TemplateASTNode[],
		initialState: DynamicAttributeScanState,
		definitions: ReadonlyMap<string, TemplateDefinitionNode>,
		preparingNames: readonly string[] = [],
	): RendererPlacementResult {
		let state = initialState;
		const nextNodes: TemplateASTNode[] = [];

		for (const node of nodes) {
			const result = this.#prepareRendererValuePlacementNode(
				node,
				state,
				definitions,
				preparingNames,
			);
			nextNodes.push(result.node);
			state = result.state;
		}

		return { nodes: nextNodes, state };
	}

	#prepareRendererValuePlacementNode(
		node: TemplateASTNode,
		state: DynamicAttributeScanState,
		definitions: ReadonlyMap<string, TemplateDefinitionNode>,
		preparingNames: readonly string[],
	): RendererPlacementNodeResult {
		if (node.type === "text") {
			return {
				node,
				state: this.#scanDynamicAttributeText(node.value, state),
			};
		}

		if (node.type === "variable") {
			return {
				node: this.#prepareRendererValuePlacementVariable(node, state),
				state,
			};
		}

		if (node.type === "if") {
			const alternate = this.#prepareRendererValuePlacementsFrom(
				node.alternate,
				state,
				definitions,
				preparingNames,
			);
			const children = this.#prepareRendererValuePlacementsFrom(
				node.children,
				state,
				definitions,
				preparingNames,
			);
			this.#assertPreservedHtmlContext(
				alternate.state,
				children.state,
				node.span,
			);

			return {
				node: {
					...node,
					alternate: alternate.nodes,
					children: children.nodes,
				},
				state: children.state,
			};
		}

		if (node.type === "block") {
			const children = this.#prepareRendererValuePlacementsFrom(
				node.children,
				state,
				definitions,
				preparingNames,
			);

			return {
				node: {
					...node,
					children: children.nodes,
				},
				state: children.state,
			};
		}

		if (node.type === "apply") {
			const children = this.#prepareRendererValuePlacementsFrom(
				node.children,
				state,
				definitions,
				preparingNames,
			);
			this.#assertPreservedHtmlContext(state, children.state, node.span);
			const templates = node.templates?.map((template) => {
				const result = this.#prepareApplyTemplateReferencePlacements(
					template,
					state,
					definitions,
					preparingNames,
				);
				this.#assertPreservedHtmlContext(state, result.state, template.span);
				return result.template;
			});
			const templateStages = node.templateStages?.map((stage) => {
				return stage.map((template) => {
					const result = this.#prepareApplyTemplateReferencePlacements(
						template,
						state,
						definitions,
						preparingNames,
					);
					this.#assertPreservedHtmlContext(state, result.state, template.span);
					return result.template;
				});
			});

			return {
				node: {
					...node,
					children: children.nodes,
					...(templates === undefined ? {} : { templates }),
					...(templateStages === undefined ? {} : { templateStages }),
				},
				state,
			};
		}

		if (node.type === "template") {
			return {
				node: {
					...node,
					children: this.#prepareRendererValuePlacementsFrom(
						node.children,
						{
							mode: "text",
						},
						definitions,
						preparingNames,
					).nodes,
				},
				state,
			};
		}

		if (node.type === "scope") {
			const result = this.#prepareRendererValuePlacementsFrom(
				node.children,
				state,
				definitions,
				preparingNames,
			);

			return {
				node: {
					...node,
					children: result.nodes,
				},
				state: result.state,
			};
		}

		return { node, state };
	}

	#prepareApplyTemplateReferencePlacements(
		template: ApplyTemplateReference,
		state: DynamicAttributeScanState,
		definitions: ReadonlyMap<string, TemplateDefinitionNode>,
		preparingNames: readonly string[],
	): RendererPlacementTemplateResult {
		if (template.type === "namedTemplate") {
			if (preparingNames.includes(template.name)) {
				if (state.mode === "text") {
					return { state, template };
				}

				throw new TemplateSyntaxError(
					"Recursive named templates cannot be applied in attribute or raw text positions",
					{ span: template.span },
				);
			}

			const definition = definitions.get(template.name);

			if (!definition) {
				return { state, template };
			}
			const children = this.#prepareRendererValuePlacementsFrom(
				definition.children,
				state,
				definitions,
				[...preparingNames, template.name],
			);

			return {
				state: children.state,
				template: { ...template, children: children.nodes },
			};
		}
		const children = this.#prepareRendererValuePlacementsFrom(
			template.children,
			state,
			definitions,
			preparingNames,
		);

		return {
			state: children.state,
			template: { ...template, children: children.nodes },
		};
	}

	#prepareRendererValuePlacementVariable(
		node: VariableNode,
		state: DynamicAttributeScanState,
	): VariableNode {
		if (state.mode === "text") {
			return {
				expression: node.expression,
				span: node.span,
				type: "variable",
			};
		}

		if (state.mode === "quotedAttributeValue") {
			return {
				...node,
				renderPosition: "attributeValue",
			};
		}

		if (state.mode === "rawText") {
			throw new TemplateSyntaxError(
				"Variables are not allowed inside script or style tags",
				{ span: node.span },
			);
		}

		if (
			state.mode === "afterEquals" ||
			state.mode === "unquotedAttributeValue"
		) {
			throw new TemplateSyntaxError(
				"Variables in unquoted attributes are not allowed",
				{ span: node.span },
			);
		}

		throw new TemplateSyntaxError(
			"Variables in attribute-list position are not allowed",
			{ span: node.span },
		);
	}

	#assertPreservedHtmlContext(
		left: DynamicAttributeScanState,
		right: DynamicAttributeScanState,
		span: SourceSpan,
	) {
		if (JSON.stringify(left) === JSON.stringify(right)) {
			return;
		}

		throw new TemplateSyntaxError(
			"Template composition must preserve HTML context",
			{ span },
		);
	}

	#scanDynamicAttributeText(
		value: string,
		initialState: DynamicAttributeScanState,
	): DynamicAttributeScanState {
		let state = initialState;

		for (let index = 0; index < value.length; index++) {
			state = this.#scanDynamicAttributeCharacter(value, index, state);
		}

		return state;
	}

	#scanDynamicAttributeCharacter(
		value: string,
		index: number,
		state: DynamicAttributeScanState,
	): DynamicAttributeScanState {
		const ch = value[index];

		if (state.mode === "text") {
			if (ch === "<" && this.#startsOpeningTag(value, index)) {
				return this.#tagState(this.#rawTextTagName(value, index));
			}

			return state;
		}

		if (state.mode === "rawText") {
			if (this.#startsClosingRawTextTag(value, index, state.tagName)) {
				return { mode: "text" };
			}

			return state;
		}

		if (state.mode === "quotedAttributeValue") {
			if (ch === state.quote) {
				return this.#tagState(this.#currentRawTextTagName(state));
			}

			return state;
		}

		if (ch === ">") {
			const rawTextTagName = this.#currentRawTextTagName(state);

			if (rawTextTagName !== undefined) {
				return { mode: "rawText", tagName: rawTextTagName };
			}

			return { mode: "text" };
		}

		if (state.mode === "tag") {
			if (ch === "=") {
				return {
					mode: "afterEquals",
					...this.#rawTextTagNameProperty(state),
				};
			}

			return state;
		}

		if (state.mode === "afterEquals") {
			if (/\s/.test(ch ?? "")) {
				return state;
			}

			if (ch === '"' || ch === "'") {
				return {
					mode: "quotedAttributeValue",
					quote: ch,
					...this.#rawTextTagNameProperty(state),
				};
			}

			return {
				mode: "unquotedAttributeValue",
				...this.#rawTextTagNameProperty(state),
			};
		}

		if (state.mode === "unquotedAttributeValue" && /\s/.test(ch ?? "")) {
			return this.#tagState(this.#currentRawTextTagName(state));
		}

		return state;
	}

	#startsOpeningTag(value: string, index: number) {
		return /^[A-Za-z]/.test(value[index + 1] ?? "");
	}

	#rawTextTagName(value: string, index: number): RawTextTagName | undefined {
		if (/^<script(?:\s|>|\/)/i.test(value.slice(index))) {
			return "script";
		}

		if (/^<style(?:\s|>|\/)/i.test(value.slice(index))) {
			return "style";
		}

		return undefined;
	}

	#startsClosingRawTextTag(
		value: string,
		index: number,
		tagName: RawTextTagName,
	) {
		return new RegExp(`^</${tagName}\\s*>`, "i").test(value.slice(index));
	}

	#tagState(
		rawTextTagName: RawTextTagName | undefined,
	): DynamicAttributeScanState {
		if (rawTextTagName === undefined) {
			return { mode: "tag" };
		}

		return { mode: "tag", rawTextTagName };
	}

	#currentRawTextTagName(state: DynamicAttributeScanState) {
		if ("rawTextTagName" in state) {
			return state.rawTextTagName;
		}

		return undefined;
	}

	#rawTextTagNameProperty(state: DynamicAttributeScanState) {
		const rawTextTagName = this.#currentRawTextTagName(state);

		if (rawTextTagName === undefined) {
			return {};
		}

		return { rawTextTagName };
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
			for (const children of this.#applyReferenceChildren(node)) {
				this.#assertValidUrlAttributesInNodes(children);
			}
			return;
		}

		if (node.type === "template") {
			this.#assertValidUrlAttributesInNodes(node.children);
			return;
		}

		if (node.type === "scope") {
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

		return [
			...ast.filter((node) => node.type === "interface"),
			...this.#mergeBlocks(resolvedParent, childBlocks),
		];
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
			for (const children of this.#applyReferenceChildren(node)) {
				this.#assertNoExtends(children);
			}
			return;
		}

		if (node.type === "template") {
			this.#assertNoExtends(node.children);
			return;
		}

		if (node.type === "scope") {
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

			if (node.type === "interface") {
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
			for (const children of this.#applyReferenceChildren(node)) {
				this.#walkNodes(children, visit);
			}
			return;
		}

		if (node.type === "template") {
			this.#walkNodes(node.children, visit);
			return;
		}

		if (node.type === "scope") {
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
				...(node.templates === undefined
					? {}
					: {
							templates: node.templates.map((template) =>
								this.#mergeApplyTemplateReference(template, childBlocks),
							),
						}),
				...(node.templateStages === undefined
					? {}
					: {
							templateStages: node.templateStages.map((stage) =>
								stage.map((template) =>
									this.#mergeApplyTemplateReference(template, childBlocks),
								),
							),
						}),
			};
		}

		if (node.type === "template") {
			return {
				...node,
				children: this.#mergeBlocks(node.children, childBlocks),
			};
		}

		if (node.type === "scope") {
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

	#applyReferenceChildren(
		node: Extract<TemplateASTNode, { type: "apply" }>,
	): readonly (readonly TemplateASTNode[])[] {
		return [node.templates, ...(node.templateStages ?? [])]
			.flatMap((templates) => templates ?? [])
			.filter((template) => template.type === "fileTemplate")
			.map((template) => template.children);
	}

	#mergeApplyTemplateReference(
		template: ApplyTemplateReference,
		childBlocks: readonly BlockNode[],
	): ApplyTemplateReference {
		if (template.type === "namedTemplate") {
			return template;
		}

		return {
			...template,
			children: this.#mergeBlocks(template.children, childBlocks),
		};
	}
}
