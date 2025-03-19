import type { ASTNode } from "./parser.js";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export class Generator {
	generate(ast: ASTNode[], context: Record<string, unknown>) {
		return ast.map((node) => this.#generateNode(node, context)).join("");
	}

	#generateNode(node: ASTNode, context: Record<string, unknown>): string {
		if (node.type === "text") {
			return node.value;
		}

		if (node.type === "block") {
			return this.generate(node.children, context);
		}

		if (node.type === "variable") {
			const variableValue = this.#resolveValue(context, node.value);

			if (
				node.value === "" ||
				variableValue === null ||
				variableValue === undefined ||
				typeof variableValue === "object" ||
				typeof variableValue === "function" ||
				typeof variableValue === "symbol"
			) {
				return "";
			}

			return this.#escape(String(variableValue));
		}

		if (node.type === "if") {
			const condition = !!this.#resolveValue(context, node.value);
			const branch = condition ? node.children : node.alternate;

			if (!branch) {
				return "";
			}

			return branch
				.map((child) => this.#generateNode(child, context))
				.join("")
				.trim();
		}

		if (node.type === "for") {
			const collection = this.#resolveValue(context, node.value);

			if (!Array.isArray(collection) || !node.iterator) {
				return "";
			}

			return collection
				.map((item) => {
					const localContext = { ...context, [node.iterator ?? ""]: item };
					return node.children
						.map((child) => this.#generateNode(child, localContext))
						.join("");
				})
				.join("");
		}

		throw new Error(`Unknown node type: ${node.type}`);
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

	#resolveValue(context: Record<string, unknown>, path: string) {
		return path.split(".").reduce<unknown>((obj, key) => {
			if (isRecord(obj) && key in obj) {
				return obj[key];
			}
			return undefined;
		}, context);
	}
}
