import type { RenderNode } from "./render-node.js";

export class Generator {
	generate(nodes: readonly RenderNode[]) {
		return nodes.map((node) => this.#generateNode(node)).join("");
	}

	#generateNode(node: RenderNode): string {
		if (node.type === "text") {
			return node.value;
		}

		return this.generate(node.children);
	}
}
