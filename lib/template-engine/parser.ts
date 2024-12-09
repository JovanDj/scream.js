import type { Token } from "./tokenizer.js";

export type ASTNode = {
	type: "text" | "variable" | "if" | "else";
	value: string;
	children: ASTNode[];
	alternate: ASTNode[];
};

export class Parser {
	parse(tokens: Token[]) {
		const ast: ASTNode[] = [];
		const stack: ASTNode[] = [];

		for (const token of tokens) {
			if (token.type === "if") {
				const ifNode: ASTNode = {
					alternate: [],
					children: [],
					type: "if",
					value: token.value,
				};
				if (stack.length === 0) {
					ast.push(ifNode);
					stack.push(ifNode);
					continue;
				}

				const parent = stack[stack.length - 1];
				if (!parent) {
					continue;
				}

				parent.children.push(ifNode);
				stack.push(ifNode);
				continue;
			}

			if (token.type === "else") {
				const ifNode = stack[stack.length - 1];

				if (!ifNode || ifNode.type !== "if") {
					throw new Error("Unexpected {% else %} without matching {% if %}");
				}

				ifNode.alternate = [];

				stack.push({
					alternate: [],
					children: ifNode.alternate,
					type: "else",
					value: "",
				});

				continue;
			}

			if (token.type === "endif") {
				const lastNode = stack.pop();

				if (!lastNode) {
					continue;
				}

				if (lastNode.type === "else") {
					stack.pop();
					continue;
				}

				stack.pop();
				continue;
			}

			const node: ASTNode = {
				alternate: [],
				children: [],
				type: token.type,
				value: token.value,
			};
			if (stack.length === 0) {
				ast.push(node);
				continue;
			}

			const parent = stack[stack.length - 1];
			if (!parent) {
				continue;
			}

			parent.children.push(node);
		}

		return ast;
	}
}
