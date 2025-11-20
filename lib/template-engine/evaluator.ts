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
		const result = path.reduce<{
			acc: unknown;
			done: boolean;
		}>(
			(state, key, index) => {
				if (state.done) {
					return state;
				}

				const acc = state.acc;

				if (acc === undefined || acc === null) {
					return { acc: undefined, done: true };
				}

				if (typeof acc === "function") {
					const remainingSegments = path
						.slice(index)
						.map((segment) =>
							typeof segment === "string" ? segment : String(segment),
						);

					return {
						acc: acc(remainingSegments.join(".")),
						done: true,
					};
				}

				if (Array.isArray(acc) && key === "length") {
					return { acc: acc.length, done: false };
				}

				if (Array.isArray(acc) && typeof key === "number") {
					return { acc: acc[key], done: false };
				}

				if (Array.isArray(acc)) {
					return { acc: undefined, done: true };
				}

				if (!this.#isRecord(acc) || typeof key !== "string") {
					return { acc: undefined, done: true };
				}

				if (!(key in acc)) {
					return { acc: undefined, done: true };
				}

				return { acc: acc[key], done: false };
			},
			{ acc: root, done: false },
		);

		return result.done ? result.acc : result.acc;
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
