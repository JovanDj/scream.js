import { RenderError } from "./render-error.js";
import type { RenderNode, RenderValueNode } from "./render-node.js";
import {
	assertValidAttributeName,
	HtmlAttributes,
	SafeHtml,
} from "./render-values.js";

export class HtmlRenderer {
	render(nodes: readonly RenderNode[]) {
		return nodes.map((node) => this.#renderNode(node)).join("");
	}

	#renderNode(node: RenderNode): string {
		if (node.type === "text") {
			return node.value;
		}

		if (node.type === "value") {
			return this.#renderValue(node);
		}

		return this.render(node.children);
	}

	#renderValue(node: RenderValueNode) {
		if (node.renderPosition === "attributes") {
			return this.#renderAttributesValue(node.value, node.expression);
		}

		return this.#renderHtmlValue(node.value, node.expression);
	}

	#renderHtmlValue(value: unknown, expression: string) {
		if (value === null || value === undefined) {
			return "";
		}

		if (value instanceof SafeHtml) {
			return value.html;
		}

		if (value instanceof HtmlAttributes) {
			throw new RenderError(
				"HtmlAttributes can only render in attribute position",
				{ expression },
			);
		}

		if (!this.#isRenderableScalar(value)) {
			throw new RenderError("Cannot render value", { expression });
		}

		return this.#escape(String(value));
	}

	#renderAttributesValue(value: unknown, expression: string) {
		if (value === null || value === undefined) {
			return "";
		}

		if (value instanceof HtmlAttributes) {
			return this.#renderAttributes(value);
		}

		throw new RenderError(
			"Only HtmlAttributes can render in attribute position",
			{ expression },
		);
	}

	#renderAttributes(attributes: HtmlAttributes) {
		return attributes.entries
			.map((attribute) =>
				this.#renderAttribute(attribute.name, attribute.value),
			)
			.join("");
	}

	#renderAttribute(name: string, value: unknown) {
		this.#assertValidAttributeName(name);

		if (value === null || value === undefined || value === false) {
			return "";
		}

		if (value === true) {
			return ` ${name}`;
		}

		return ` ${name}="${this.#escape(String(value))}"`;
	}

	#assertValidAttributeName(name: string) {
		try {
			assertValidAttributeName(name);
		} catch {
			throw new RenderError("Invalid HTML attribute name", {
				expression: name,
			});
		}
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
