import type { ASTNode } from "./parser.js";

export class Transformer {
	applyBlockOverrides(
		parentAST: readonly ASTNode[],
		childAST: readonly ASTNode[],
		childBlocks = childAST.filter((node) => node.type === "block"),
	): readonly ASTNode[] {
		return parentAST.map((node) => {
			if (node.type !== "block") {
				return node;
			}

			const override = childBlocks.find((b) => b.value === node.value);
			const newChildren = override?.children ?? node.children ?? [];

			const ast: ASTNode = {
				...node,
				children: this.applyBlockOverrides(newChildren, childAST, childBlocks),
			};

			return ast;
		});
	}
}
