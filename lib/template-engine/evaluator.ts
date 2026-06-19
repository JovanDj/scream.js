import type { TemplateASTNode, TemplateDefinitionNode } from "./ast.js";
import type { RenderContext } from "./context.js";
import type { ExpressionNode } from "./expression.js";
import { RenderError } from "./render-error.js";
import type { RenderNode } from "./render-node.js";

const MISSING = Symbol("missing");

type TemplateMap = ReadonlyMap<string, TemplateDefinitionNode>;

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
		const children = node.templateName
			? this.#templateChildren(node.templateName, templates)
			: node.children;

		return items.flatMap((item) =>
			this.#evaluateNodes(
				children,
				{
					attr: item,
				},
				templates,
			),
		);
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
			if (node.type !== "apply" || node.templateName === undefined) {
				return;
			}

			if (!templates.has(node.templateName)) {
				throw new RenderError(`Unknown template: ${node.templateName}`, {
					expression: node.templateName,
				});
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

			if (this.#isRecord(acc) && Object.hasOwn(acc, key)) {
				return acc[key];
			}

			return MISSING;
		}, root);
	}
}
