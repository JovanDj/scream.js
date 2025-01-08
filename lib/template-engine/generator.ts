import type { ASTNode } from "./parser.js";

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
			const keys = node.value.split(".");

			const variableValue = keys.reduce((acc, key) => {
				return acc[key] as Record<string, unknown>;
			}, context);

			if (
				node.value === "" ||
				variableValue === undefined ||
				variableValue === null ||
				typeof variableValue === "object" ||
				typeof variableValue === "function"
			) {
				return "";
			}

			return this.#escape(String(variableValue));
		}

		if (node.type === "if") {
			const condition = !!context[node.value];
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
			const collection = context[node.value];

			if (!Array.isArray(collection) || !node.iterator) {
				// If collection is not an array or iterator is missing, return an empty string
				return "";
			}

			// Map over the collection and render children for each iteration
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
}
