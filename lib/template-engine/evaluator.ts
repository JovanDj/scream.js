import type { ASTNode } from "./parser.js";

export class Evaluator {
	evaluate(ast: readonly ASTNode[], context: Record<string, unknown>) {
		return ast.map((node) => this.#evaluateNode(node, context));
	}

	#evaluateNode(node: ASTNode, context: Record<string, unknown>) {
		switch (node.type) {
			case "text":
			case "extends":
				return node;

			case "variable":
				return this.#evaluateVariable(node, context);

			case "if":
				return this.#evaluateIf(node, context);

			case "for":
				return this.#evaluateFor(node, context);

			case "block":
				return this.#evaluateBlock(node, context);

			default:
				throw new Error(`Unknown node type: ${node.type}`);
		}
	}

	#isRecord(x: unknown): x is Record<string, unknown> {
		return !!x && typeof x === "object";
	}

	#getPathFromNode(node: ASTNode) {
		if (Array.isArray(node.path)) {
			return node.path;
		}

		const raw = node.value ?? "";
		return Array.from(
			raw.matchAll(/([a-zA-Z0-9_]+)|\[(\d+)\]/g),
			(m) => m[1] ?? Number(m[2]),
		);
	}

	#resolvePath(root: unknown, path: readonly (string | number)[]) {
		return path.reduce<unknown>((acc, key) => {
			if (!acc) {
				return undefined;
			}

			if (Array.isArray(acc) && typeof key === "number") {
				return acc[key];
			}
			if (this.#isRecord(acc) && key in acc) {
				return acc[key];
			}
			return undefined;
		}, root);
	}

	#evaluateVariable(node: ASTNode, context: Record<string, unknown>) {
		const path = this.#getPathFromNode(node);
		const raw = this.#resolvePath(context, path);

		return {
			...node,
			value: this.#evaluateVariableValue(raw),
		};
	}

	#evaluateVariableValue(value: unknown) {
		if (Array.isArray(value)) {
			return value.map((v) => this.#escape(String(v))).join(", ");
		}

		if (
			value === null ||
			value === undefined ||
			typeof value === "object" ||
			typeof value === "function" ||
			typeof value === "symbol"
		) {
			return "";
		}

		return this.#escape(String(value));
	}

	#escape(value: string) {
		if (/&(?:amp|lt|gt|quot|#39);/.test(value)) {
			return value;
		}

		return value
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	#evaluateIf(node: ASTNode, context: Record<string, unknown>): ASTNode {
		const path = (node.value ?? "")
			.split(".")
			.map((s) => s.trim())
			.filter(Boolean);

		const condValue = this.#resolvePath(context, path);

		const truthy = Boolean(condValue);
		const evaluatedChildren = truthy
			? (node.children ?? []).map((child) => this.#evaluateNode(child, context))
			: [];

		const evaluatedAlternate =
			!truthy && node.alternate
				? node.alternate.map((child) => this.#evaluateNode(child, context))
				: [];

		return {
			...node,
			alternate: evaluatedAlternate,
			children: evaluatedChildren,
		};
	}

	#evaluateFor(node: ASTNode, context: Record<string, unknown>): ASTNode {
		const path = (node.value ?? "")
			.split(".")
			.map((s) => s.trim())
			.filter(Boolean);

		const collection = this.#resolvePath(context, path);

		if (!Array.isArray(collection) || !node.iterator) {
			return { ...node, children: [] };
		}

		const iteratorKey = node.iterator;

		const expandedChildren = collection.flatMap((item) =>
			(node.children ?? []).map((child) =>
				this.#evaluateNode(child, { ...context, [iteratorKey]: item }),
			),
		);

		return {
			...node,
			children: expandedChildren,
		};
	}

	#evaluateBlock(node: ASTNode, context: Record<string, unknown>): ASTNode {
		return {
			...node,
			children: (node.children ?? []).map((child) =>
				this.#evaluateNode(child, context),
			),
		};
	}
}
