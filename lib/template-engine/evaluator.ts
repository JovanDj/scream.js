import type { ASTNode } from "./parser.js";

export class Evaluator {
	// Now accepts context for variable resolution
	evaluate(ast: readonly ASTNode[], context: Record<string, unknown>) {
		return ast.map((node) => this.#evaluateNode(node, context));
	}

	#evaluateNode(node: ASTNode, context: Record<string, unknown>): ASTNode {
		switch (node.type) {
			case "text":
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

	#evaluateVariable(node: ASTNode, context: Record<string, unknown>) {
		const isRecord = (x: unknown): x is Record<string, unknown> =>
			x !== null && typeof x === "object";

		const raw = node.value.split(".").reduce<unknown>((acc, key) => {
			if (isRecord(acc) && key in acc) {
				return acc[key];
			}
			return undefined;
		}, context);

		return {
			...node,
			value: this.#evaluateVariableValue(raw),
		};
	}

	#evaluateVariableValue(value: unknown) {
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

	#evaluateIf(node: ASTNode, context: Record<string, unknown>) {
		const keys = node.value.split(".");
		let value: unknown = context;

		for (const key of keys) {
			if (typeof value === "object" && value !== null && key in value) {
				value = (value as Record<string, unknown>)[key];
			} else {
				value = undefined;
				break;
			}
		}

		const isTruthy = !!value;

		const ast: ASTNode = {
			...node,
			children: isTruthy
				? node.children.map((child) => this.#evaluateNode(child, context))
				: [],
			alternate:
				!isTruthy && node.alternate
					? node.alternate.map((child) => this.#evaluateNode(child, context))
					: [],
		};

		return ast;
	}

	#evaluateFor(node: ASTNode, context: Record<string, unknown>) {
		const path = node.value;
		const keys = path.split(".");
		let collection: unknown = context;

		for (const key of keys) {
			if (
				typeof collection === "object" &&
				collection !== null &&
				key in collection
			) {
				collection = (collection as Record<string, unknown>)[key];
			} else {
				collection = undefined;
				break;
			}
		}

		if (!Array.isArray(collection) || !node.iterator) {
			return { ...node, children: [] };
		}

		const expandedChildren: ASTNode[] = [];

		for (const item of collection) {
			const localContext = { ...context, [node.iterator]: item };
			const evaluated = node.children.map((child) =>
				this.#evaluateNode(child, localContext),
			);
			expandedChildren.push(...evaluated);
		}

		return {
			...node,
			children: expandedChildren,
		};
	}

	#evaluateBlock(node: ASTNode, context: Record<string, unknown>) {
		return {
			...node,
			children: node.children.map((child) =>
				this.#evaluateNode(child, context),
			),
		};
	}
}
