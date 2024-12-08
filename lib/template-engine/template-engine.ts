export class ScreamTemplateEngine {
	compile(template: string, context: Record<string, unknown>) {
		return template.replace(/{{\s*(\w*)\s*}}/g, (_, variable) => {
			if (!variable) {
				return "";
			}

			const value = context[variable];

			if (typeof value === "object" || typeof value === "function") {
				return "";
			}

			return value !== undefined && value !== null
				? this.#escapeHtml(String(value))
				: "";
		});
	}

	#escapeHtml(value: string) {
		if (this.#isAlreadyEscaped(value)) {
			return value;
		}

		return value
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	#isAlreadyEscaped(value: string) {
		return /&amp;|&lt;|&gt;|&quot;|&#39;/.test(value);
	}
}
