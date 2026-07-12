import { RenderError } from "./render-error.js";
import type { RenderNode, RenderValueNode } from "./render-node.js";
import {
	FormattedDate,
	FormattedNumber,
	RenderedTemplateValue,
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
		if (node.renderPosition === "attributeValue") {
			return this.#renderQuotedAttributeValue(node.value, node.expression);
		}

		return this.#renderHtmlValue(node.value, node.expression);
	}

	#renderHtmlValue(value: unknown, expression: string) {
		if (value === null || value === undefined) {
			return "";
		}

		if (value instanceof RenderedTemplateValue) {
			return this.render(value.nodes);
		}

		if (this.#isFormattedValue(value)) {
			return this.#escape(this.#formatValue(value));
		}

		if (!this.#isRenderableScalar(value)) {
			throw new RenderError("Cannot render value", { expression });
		}

		return this.#escape(String(value));
	}

	#renderQuotedAttributeValue(value: unknown, expression: string) {
		if (value === null || value === undefined) {
			return "";
		}

		if (
			value instanceof RenderedTemplateValue ||
			!this.#isRenderableScalar(value)
		) {
			if (this.#isFormattedValue(value)) {
				return this.#escape(this.#formatValue(value));
			}

			throw new RenderError("Cannot render value in quoted attribute", {
				expression,
			});
		}

		return this.#escape(String(value));
	}

	#isFormattedValue(value: unknown): value is FormattedDate | FormattedNumber {
		return value instanceof FormattedDate || value instanceof FormattedNumber;
	}

	#formatValue(value: FormattedDate | FormattedNumber) {
		if (value instanceof FormattedDate) {
			return new Intl.DateTimeFormat(value.locale, value.options).format(
				value.date,
			);
		}

		return new Intl.NumberFormat(value.locale, value.options).format(
			value.value,
		);
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
