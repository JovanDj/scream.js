export class ScreamTemplateEngine {
	compile(template: string, context: Record<string, unknown>) {
		return template.replace(/{{\s*(\w*)\s*}}/g, (_, variable) => {
			if (!variable) {
				return "";
			}

			const value = context[variable];
			return value !== undefined && value !== null
				? this.#escapeHtml(String(value))
				: "";
		});
	}

	#escapeHtml(value: string) {
		return value
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}
}
