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
				const path = this.#getPathFromExpression(node.expression);
				const raw = this.#resolvePath(context, path);

				return [
					{ type: "text", value: this.#evaluateVariableValue(raw, path) },
				];
			}

			case "if": {
				const path = this.#getPathFromExpression(node.condition);
				const conditionValue = this.#resolvePath(context, path);
				const selectedBranch = conditionValue ? node.children : node.alternate;

				return selectedBranch.flatMap((child) =>
					this.#evaluateNode(child, context),
				);
			}

			case "for": {
				const path = this.#getPathFromExpression(node.collection);
				const collection = this.#resolvePath(context, path);

				if (!Array.isArray(collection)) {
					throw new RenderError("Loop collection must be an array", {
						expression: this.#formatPath(path),
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

	#getPathFromExpression(expression: ExpressionNode) {
		return expression.segments;
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

	#evaluateVariableValue(value: unknown, path: readonly (string | number)[]) {
		if (
			value === null ||
			value === undefined ||
			Array.isArray(value) ||
			typeof value === "object" ||
			typeof value === "function" ||
			typeof value === "symbol"
		) {
			throw new RenderError("Cannot render value", {
				expression: this.#formatPath(path),
			});
		}

		return this.#escape(String(value));
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
}
