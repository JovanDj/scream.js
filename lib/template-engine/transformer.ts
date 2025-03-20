import type { ASTNode } from "./parser.js";

export class Transformer {
	applyBlockOverrides(parentAST: ASTNode[], childAST: ASTNode[]): ASTNode[] {
		const childBlocks = childAST.filter((node) => node.type === "block");

		return parentAST.map((node) => {
			if (node.type !== "block") return node;

			const override = childBlocks.find((b) => b.value === node.value);
			const newChildren = override?.children ?? node.children;

			return {
				...node,
				children: this.applyBlockOverrides(newChildren, childAST),
			};
		});
	}
}
