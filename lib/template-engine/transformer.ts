import type { ASTNode } from "./parser.js";

export class Transformer {
	transform(
		parentAST: readonly ASTNode[],
		childAST: readonly ASTNode[],
	): readonly ASTNode[] {
		const childBlocks = this.#collectChildBlocks(childAST);
		const transformed = this.#mergeBlocks(parentAST, childBlocks);
		return this.#simplify(transformed);
	}

	#collectChildBlocks(nodes: readonly ASTNode[]): readonly ASTNode[] {
		const blocks: ASTNode[] = [];

		for (const n of nodes) {
			if (n.type === "block") {
				const exists = blocks.some((b) => b.value === n.value);

				if (!exists) {
					blocks.push(n);
				}
			}
		}
		return blocks.sort((a, b) => (a.value ?? "").localeCompare(b.value ?? ""));
	}

	#mergeBlocks(
		nodes: readonly ASTNode[],
		childBlocks: readonly ASTNode[],
	): readonly ASTNode[] {
		return nodes.map((node) => {
			if (node.type !== "block") {
				return node;
			}

			const override = childBlocks.find((b) => b.value === node.value);
			const newChildren = override?.children ?? node.children ?? [];

			return { ...node, children: this.#mergeBlocks(newChildren, childBlocks) };
		});
	}

	#simplify(ast: readonly ASTNode[]): readonly ASTNode[] {
		const simplified: ASTNode[] = [];

		for (const node of ast) {
			if (node.type === "text") {
				const last = simplified[simplified.length - 1];

				if (last?.type === "text") {
					simplified[simplified.length - 1] = {
						...last,
						value: ((last.value ?? "") + (node.value ?? "")).replace(
							/\s+/g,
							" ",
						),
					};
					continue;
				}
			}

			const newChildren = node.children
				? this.#simplify(node.children)
				: node.children;

			if (node.type === "if" && (!newChildren || newChildren.length === 0)) {
				if (node.alternate && node.alternate.length > 0) {
					simplified.push(...this.#simplify(node.alternate));
				}
				continue;
			}

			if (newChildren !== node.children) {
				simplified.push({ ...node, children: newChildren ?? [] });
			} else {
				simplified.push(node);
			}
		}

		return simplified;
	}
}
