import type { ASTNode } from "./parser.js";

export class Evaluator {
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

		const ast: ASTNode = {
			...node,
			value: this.#evaluateVariableValue(raw),
		};

		return ast;
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
		const isRecord = (value: unknown): value is Record<string, unknown> => {
			return typeof value === "object" && value !== null;
		};

		const value = node.value.split(".").reduce((acc: unknown, key: string) => {
			if (isRecord(acc) && key in acc) {
				return acc[key];
			}
			return undefined;
		}, context);

		const ast: ASTNode = {
			...node,
			children: value
				? (node.children ?? []).map((child) =>
						this.#evaluateNode(child, context),
					)
				: [],
			alternate:
				!value && node.alternate
					? node.alternate.map((child) => this.#evaluateNode(child, context))
					: [],
		};

		return ast;
	}

	#evaluateFor(node: ASTNode, context: Record<string, unknown>) {
		const isRecord = (v: unknown): v is Record<string, unknown> =>
			typeof v === "object" && v !== null;

		const collection = node.value
			.split(".")
			.reduce<unknown>(
				(acc, key) => (isRecord(acc) && key in acc ? acc[key] : undefined),
				context,
			);

		if (!Array.isArray(collection) || !node.iterator) {
			return { ...node, children: [] };
		}

		const iteratorKey = node.iterator;

		return {
			...node,
			children: collection.flatMap((item) =>
				(node.children ?? []).map((child) =>
					this.#evaluateNode(child, { ...context, [iteratorKey]: item }),
				),
			),
		};
	}

	#evaluateBlock(node: ASTNode, context: Record<string, unknown>) {
		const ast: ASTNode = {
			...node,
			children: (node.children ?? []).map((child) =>
				this.#evaluateNode(child, context),
			),
		};
		return ast;
	}
}
