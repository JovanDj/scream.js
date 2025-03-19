import type { Token } from "./tokenizer.js";

export type ASTNode = {
	type:
		| "text"
		| "variable"
		| "if"
		| "else"
		| "for"
		| "endfor"
		| "extends"
		| "block"
		| "endblock";
	value: string;
	children: ASTNode[];
	alternate?: ASTNode[];
	iterator?: string | undefined;
};

export class Parser {
	parse(tokens: Token[]) {
		const ast: ASTNode[] = [];
		const stack: ASTNode[] = [];

		for (const token of tokens) {
			if (token.type === "extends") {
				const extendsNode: ASTNode = {
					children: [],
					type: "extends",
					value: token.value,
				};
				ast.push(extendsNode);
				continue;
			}

			if (token.type === "block") {
				const blockNode: ASTNode = {
					children: [],
					type: "block",
					value: token.value,
				};

				if (stack.length === 0) {
					ast.push(blockNode);
					stack.push(blockNode);
					continue;
				}

				blockNode.children.push(blockNode);

				stack.push(blockNode);
				continue;
			}

			if (token.type === "endblock") {
				stack.pop();
				continue;
			}

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

			if (token.type === "for") {
				if (token.type === "for") {
					const forNode: ASTNode = {
						alternate: [],
						children: [],
						iterator: token.iterator,
						type: "for",
						value: token.value,
					};

					if (stack.length === 0) {
						ast.push(forNode);
					} else {
						const parent = stack.at(-1);
						if (parent) {
							parent.children = [...(parent.children || []), forNode];
						}
					}

					stack.push(forNode);
					continue;
				}
			}

			if (token.type === "endfor") {
				if (stack.at(-1)?.type !== "for") {
					throw new Error("Unexpected {% endfor %} without matching {% for %}");
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
