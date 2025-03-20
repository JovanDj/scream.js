import type { ASTNode } from "./parser.js";

export class Generator {
	generate(ast: readonly ASTNode[]) {
		return ast.map((node) => this.#generateNode(node)).join("");
	}

	#generateNode(node: ASTNode): string {
		if (!node.value) {
			return "";
		}

		if (node.type === "text" || node.type === "variable") {
			return node.value;
		}

		if (node.type === "block" || node.type === "for") {
			return this.generate(node.children ?? []);
		}

		if (node.type === "if") {
			const hasTruthyBranch = (node.children ?? []).length > 0;
			const branch = hasTruthyBranch
				? (node.children ?? [])
				: (node.alternate ?? []);
			return this.generate(branch).trim();
		}

		throw new Error(`Unexpected node type in evaluated AST: ${node.type}`);
	}
}
