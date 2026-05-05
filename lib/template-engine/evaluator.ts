import type { TemplateASTNode } from "./ast.js";
import type { RenderContext } from "./context.js";
import type { ExpressionNode } from "./expression.js";
import { RenderError } from "./render-error.js";
import type { RenderNode } from "./render-node.js";

export class Evaluator {
	evaluate(
		ast: readonly TemplateASTNode[],
		context: RenderContext,
	): readonly RenderNode[] {
		return ast.flatMap((node) => this.#evaluateNode(node, context));
	}

	#evaluateNode(
		node: TemplateASTNode,
		context: RenderContext,
	): readonly RenderNode[] {
		switch (node.type) {
			case "text":
				return [{ type: "text", value: node.value }];

			case "variable": {
				const raw = this.#evaluateExpression(node.expression, context);

				return [
					{
						type: "text",
						value: this.#evaluateVariableValue(raw, node.expression),
					},
				];
			}

			case "if": {
				const conditionValue = this.#evaluateExpression(
					node.condition,
					context,
				);
				const selectedBranch = conditionValue ? node.children : node.alternate;

				return selectedBranch.flatMap((child) =>
					this.#evaluateNode(child, context),
				);
			}

			case "for": {
				const collection = this.#evaluateExpression(node.collection, context);

				if (!Array.isArray(collection)) {
					throw new RenderError("Loop collection must be an array", {
						expression: this.#formatExpression(node.collection),
					});
				}

				return collection.flatMap((item) =>
					node.children.flatMap((child) =>
						this.#evaluateNode(child, {
							...context,
							[node.iterator]: item,
						}),
					),
				);
			}

			case "block":
				return [
					{
						children: node.children.flatMap((child) =>
							this.#evaluateNode(child, context),
						),
						type: "block",
					},
				];

			case "attr":
				return [{ type: "text", value: this.#evaluateAttr(node, context) }];

			case "extends":
				throw new RenderError(
					"Extends nodes must be resolved before evaluation",
					{ expression: node.template },
				);
		}
	}

	#isRecord(x: unknown): x is Record<string, unknown> {
		return !!x && typeof x === "object";
	}

	#isRenderableScalar(value: unknown) {
		return (
			value !== null &&
			value !== undefined &&
			!Array.isArray(value) &&
			typeof value !== "object" &&
			typeof value !== "function" &&
			typeof value !== "symbol"
		);
	}

	#evaluateExpression(expression: ExpressionNode, context: RenderContext) {
		if (expression.type === "literal") {
			return expression.value;
		}

		return this.#resolvePath(context, expression.segments);
	}

	#formatExpression(expression: ExpressionNode): string {
		if (expression.type === "literal") {
			return String(expression.value);
		}

		return this.#formatPath(expression.segments);
	}

	#formatPath(path: readonly (string | number)[]): string {
		return path
			.map((part, index) => {
				if (typeof part === "number") {
					return `[${part}]`;
				}

				return index === 0 ? part : `.${part}`;
			})
			.join("");
	}

	#resolvePath(root: unknown, path: readonly (string | number)[]) {
		const expression = this.#formatPath(path);

		return path.reduce<unknown>((acc, key) => {
			if (Array.isArray(acc)) {
				if (key === "length") {
					return acc.length;
				}

				if (typeof key === "number" && key >= 0 && key < acc.length) {
					return acc[key];
				}
			} else if (this.#isRecord(acc) && Object.hasOwn(acc, key)) {
				return acc[key];
			}

			throw new RenderError("Missing value", { expression });
		}, root);
	}

	#evaluateVariableValue(value: unknown, expression: ExpressionNode) {
		if (!this.#isRenderableScalar(value)) {
			throw new RenderError("Cannot render value", {
				expression: this.#formatExpression(expression),
			});
		}

		return this.#escape(String(value));
	}

	#evaluateAttr(
		node: Extract<TemplateASTNode, { type: "attr" }>,
		context: RenderContext,
	) {
		const condition = this.#evaluateExpression(node.condition, context);

		if (!condition) {
			return "";
		}

		if (!node.value) {
			return ` ${node.name}`;
		}

		const rawValue = this.#evaluateExpression(node.value, context);

		if (rawValue === undefined) {
			return "";
		}

		if (!this.#isRenderableScalar(rawValue)) {
			throw new RenderError("Cannot render attribute value", {
				expression: this.#formatExpression(node.value),
			});
		}

		return ` ${node.name}="${this.#escapeAttribute(String(rawValue))}"`;
	}

	#escape(value: string) {
		const ESCAPE_MAP: Record<string, string> = {
			"'": "&#39;",
			'"': "&quot;",
			"&": "&amp;",
			"`": "&#96;",
			"<": "&lt;",
			">": "&gt;",
		};

		const replacedValue = value.replace(
			/&(?!amp;|lt;|gt;|quot;|#39;)/g,
			"&amp;",
		);

		return replacedValue.replace(/[<>"'`]/g, (ch) => {
			return ESCAPE_MAP[ch] ?? ch;
		});
	}

	#escapeAttribute(value: string) {
		const ESCAPE_MAP: Record<string, string> = {
			'"': "&quot;",
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
		};

		return value.replace(/[&"<>]/g, (ch) => {
			return ESCAPE_MAP[ch] ?? ch;
		});
	}
}
