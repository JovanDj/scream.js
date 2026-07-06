import type {
	ApplyTemplateReference,
	TemplateASTNode,
	TemplateDefinitionNode,
	TemplateParameterBinding,
} from "./ast.js";
import type { RenderContext } from "./context.js";
import type { ExpressionNode } from "./expression.js";
import { RenderError } from "./render-error.js";
import type { RenderNode } from "./render-node.js";
import { RenderedTemplateValue } from "./render-values.js";

const MISSING = Symbol("missing");

type TemplateMap = ReadonlyMap<string, TemplateDefinitionNode>;
type AppliedTemplate = {
	readonly children: readonly TemplateASTNode[];
	readonly parameters?: readonly TemplateParameterBinding[];
};

export class Evaluator {
	evaluate(
		ast: readonly TemplateASTNode[],
		context: RenderContext,
	): readonly RenderNode[] {
		const templates = this.#indexTemplates(ast);
		this.#assertKnownNamedApplications(ast, templates);

		return this.#evaluateNodes(ast, context, templates);
	}

	#evaluateNodes(
		ast: readonly TemplateASTNode[],
		context: RenderContext,
		templates: TemplateMap,
	): readonly RenderNode[] {
		return ast.flatMap((node) => this.#evaluateNode(node, context, templates));
	}

	#evaluateNode(
		node: TemplateASTNode,
		context: RenderContext,
		templates: TemplateMap,
	): readonly RenderNode[] {
		if (node.type === "text") {
			return [{ type: "text", value: node.value }];
		}

		if (node.type === "variable") {
			const raw = this.#resolvePath(context, node.expression.segments);

			return [
				{
					expression: this.#formatExpression(node.expression),
					...(node.renderPosition === undefined
						? {}
						: { renderPosition: node.renderPosition }),
					type: "value",
					value: raw === MISSING ? undefined : raw,
				},
			];
		}

		if (node.type === "if") {
			const selectedBranch = this.#isPresent(node.condition, context)
				? node.children
				: node.alternate;

			return this.#evaluateNodes(selectedBranch, context, templates);
		}

		if (node.type === "interface") {
			for (const attribute of node.attributes) {
				if (!this.#isPresent(attribute, context)) {
					throw new RenderError(
						`Missing template attribute: ${this.#formatExpression(attribute)}`,
						{ expression: this.#formatExpression(attribute) },
					);
				}
			}

			return [];
		}

		if (node.type === "apply") {
			return this.#evaluateApply(node, context, templates);
		}

		if (node.type === "block") {
			return [
				{
					children: this.#evaluateNodes(node.children, context, templates),
					type: "block",
				},
			];
		}

		if (node.type === "scope") {
			return this.#evaluateNodes(
				node.children,
				this.#scopeContext(node.bindings, context),
				templates,
			);
		}

		if (node.type === "template") {
			return [];
		}

		throw new RenderError("Extends nodes must be resolved before evaluation", {
			expression: node.template,
		});
	}

	#evaluateApply(
		node: Extract<TemplateASTNode, { type: "apply" }>,
		context: RenderContext,
		templates: TemplateMap,
	) {
		const raw = this.#resolvePath(context, node.source.segments);

		if (raw === MISSING || raw === null || raw === undefined) {
			return [];
		}

		const items = Array.isArray(raw) ? raw : [raw];

		if (node.templates !== undefined) {
			return this.#evaluateApplyTemplateStages(
				items,
				[node.templates, ...(node.templateStages ?? [])],
				context,
				templates,
			);
		}

		return items.flatMap((item) => {
			return this.#evaluateNodes(
				node.children,
				{
					attr: item,
				},
				templates,
			);
		});
	}

	#evaluateApplyTemplateStages(
		items: readonly unknown[],
		stages: readonly (readonly ApplyTemplateReference[])[],
		context: RenderContext,
		templates: TemplateMap,
	): readonly RenderNode[] {
		const values = stages.reduce<readonly unknown[]>((currentItems, stage) => {
			return currentItems.map((item, index) => {
				return RenderedTemplateValue.fromNodes(
					this.#evaluateAppliedTemplate(item, index, stage, context, templates),
				);
			});
		}, items);

		return values.flatMap((value) => {
			if (value instanceof RenderedTemplateValue) {
				return value.nodes;
			}

			return [];
		});
	}

	#evaluateAppliedTemplate(
		item: unknown,
		index: number,
		references: readonly ApplyTemplateReference[],
		context: RenderContext,
		templates: TemplateMap,
	) {
		const appliedTemplate = this.#applyTemplateForItem(
			references,
			index,
			templates,
		);

		return this.#evaluateNodes(
			appliedTemplate.children,
			{
				attr: item,
				...this.#scopeContext(appliedTemplate.parameters ?? [], context),
			},
			templates,
		);
	}

	#scopeContext(
		bindings: readonly TemplateParameterBinding[],
		context: RenderContext,
	): RenderContext {
		return Object.fromEntries(
			bindings.map((binding) => {
				const value = this.#resolvePath(context, binding.expression.segments);

				return [binding.name, value === MISSING ? undefined : value] as const;
			}),
		);
	}

	#applyTemplateForItem(
		references: readonly ApplyTemplateReference[],
		index: number,
		templates: TemplateMap,
	): AppliedTemplate {
		const template = this.#applyTemplateReferenceForItem(references, index);

		if (template.type === "fileTemplate") {
			return {
				children: template.children,
				...(template.parameters === undefined
					? {}
					: { parameters: template.parameters }),
			};
		}

		return {
			children:
				template.children ?? this.#templateChildren(template.name, templates),
			...(template.parameters === undefined
				? {}
				: { parameters: template.parameters }),
		};
	}

	#applyTemplateReferenceForItem(
		templates: readonly ApplyTemplateReference[],
		index: number,
	) {
		const template = templates[index % templates.length];

		if (template === undefined) {
			throw new RenderError("Template reference required");
		}

		return template;
	}

	#templateChildren(name: string, templates: TemplateMap) {
		const template = templates.get(name);

		if (!template) {
			throw new RenderError(`Unknown template: ${name}`, { expression: name });
		}

		return template.children;
	}

	#indexTemplates(ast: readonly TemplateASTNode[]) {
		const templates = new Map<string, TemplateDefinitionNode>();

		this.#walkNodes(ast, (node) => {
			if (node.type !== "template") {
				return;
			}

			if (templates.has(node.name)) {
				throw new RenderError(`Duplicate template: ${node.name}`, {
					expression: node.name,
				});
			}

			templates.set(node.name, node);
		});

		return templates;
	}

	#assertKnownNamedApplications(
		ast: readonly TemplateASTNode[],
		templates: TemplateMap,
	) {
		this.#walkNodes(ast, (node) => {
			if (node.type !== "apply") {
				return;
			}

			for (const template of [
				...(node.templates ?? []),
				...(node.templateStages ?? []).flat(),
			]) {
				if (template.type === "fileTemplate") {
					continue;
				}

				if (!templates.has(template.name)) {
					throw new RenderError(`Unknown template: ${template.name}`, {
						expression: template.name,
					});
				}
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
			for (const template of [
				...(node.templates ?? []),
				...(node.templateStages ?? []).flat(),
			]) {
				if (template.type === "fileTemplate") {
					this.#walkNodes(template.children, visit);
				}
			}
			return;
		}

		if (node.type === "template") {
			this.#walkNodes(node.children, visit);
			return;
		}

		if (node.type === "scope") {
			this.#walkNodes(node.children, visit);
		}
	}

	#isRecord(x: unknown): x is Record<string, unknown> {
		return !!x && typeof x === "object" && !Array.isArray(x);
	}

	#isPresent(expression: ExpressionNode, context: RenderContext) {
		const value = this.#resolvePath(context, expression.segments);

		return value !== MISSING && value !== null && value !== undefined;
	}

	#formatExpression(expression: ExpressionNode): string {
		return this.#formatPath(expression.segments);
	}

	#formatPath(path: readonly string[]): string {
		return path.join(".");
	}

	#resolvePath(root: unknown, path: readonly string[]) {
		return path.reduce<unknown>((acc, key) => {
			if (acc === MISSING) {
				return MISSING;
			}

			if (Array.isArray(acc)) {
				throw new RenderError("Cannot access array value", {
					expression: this.#formatPath(path),
				});
			}

			if (this.#isRecord(acc)) {
				const descriptor = Object.getOwnPropertyDescriptor(acc, key);

				if (descriptor === undefined) {
					return MISSING;
				}

				if (!("value" in descriptor)) {
					throw new RenderError("Cannot access accessor property", {
						expression: this.#formatPath(path),
					});
				}

				return descriptor.value;
			}

			return MISSING;
		}, root);
	}
}
