import type { RenderNode } from "./render-node.js";

export class Generator {
	generate(nodes: readonly RenderNode[]) {
		return nodes.map((node) => this.#generateNode(node)).join("");
	}

	#generateNode(node: RenderNode): string {
		switch (node.type) {
			case "text":
				return node.value;

			case "block":
				return this.generate(node.children);
		}
	}
}
