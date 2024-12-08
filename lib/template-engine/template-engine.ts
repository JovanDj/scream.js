export class ScreamTemplateEngine {
	compile(template: string, context: Record<string, unknown>) {
		return template.replace(/{{\s*(\w*)\s*}}/g, (_, variable) => {
			if (!variable) {
				return "";
			}

			const value = context[variable];
			return value !== undefined && value !== null ? String(value) : "";
		});
	}
}
