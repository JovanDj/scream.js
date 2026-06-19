import { RenderError } from "./render-error.js";
import type { RenderNode } from "./render-node.js";

export class HtmlRenderer {
	render(nodes: readonly RenderNode[]) {
		return nodes.map((node) => this.#renderNode(node)).join("");
	}

	#renderNode(node: RenderNode): string {
		if (node.type === "text") {
			return node.value;
		}

		if (node.type === "value") {
			return this.#renderValue(node.value, node.expression);
		}

		return this.render(node.children);
	}

	#renderValue(value: unknown, expression: string) {
		if (value === null || value === undefined) {
			return "";
		}

		if (!this.#isRenderableScalar(value)) {
			throw new RenderError("Cannot render value", { expression });
		}

		return this.#escape(String(value));
	}

	#isRenderableScalar(value: unknown) {
		return (
			!Array.isArray(value) &&
			typeof value !== "object" &&
			typeof value !== "function" &&
			typeof value !== "symbol"
		);
	}

	#escape(value: string) {
		const escapeMap: Record<string, string> = {
			"'": "&#39;",
			'"': "&quot;",
			"&": "&amp;",
			"`": "&#96;",
			"<": "&lt;",
			">": "&gt;",
		};

		const replacedValue = value.replace(
			/&(?!amp;|lt;|gt;|quot;|#39;)/g,
			"&amp;",
		);

		return replacedValue.replace(/[<>"'`]/g, (ch) => {
			return escapeMap[ch] ?? ch;
		});
	}
}
