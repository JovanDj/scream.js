export class ScreamTemplateEngine {
	compile(template: string, context: Record<string, unknown>) {
		return this.#parse(template, context);
	}

	#parse(template: string, context: Record<string, unknown>) {
		const result: string[] = [];
		let index = 0;

		while (index < template.length) {
			const currentChar = template[index];

			if (!currentChar) {
				continue;
			}

			if (currentChar === "{") {
				if (template[index + 1] === "{") {
					const { replacement, newIndex } = this.#parseVariable(
						template,
						index,
						context,
					);
					result.push(replacement);
					index = newIndex;
					continue;
				}
			}

			result.push(currentChar);
			index++;
		}

		return result.join("");
	}

	#parseVariable(
		template: string,
		startIndex: number,
		context: Record<string, unknown>,
	) {
		const endIndex = template.indexOf("}}", startIndex);

		if (endIndex === -1) {
			return {
				replacement: template.slice(startIndex),
				newIndex: startIndex + template.length,
			};
		}

		const variable = template.slice(startIndex + 2, endIndex).trim();
		if (variable === "") {
			return { replacement: "", newIndex: endIndex + 2 };
		}

		const value = context[variable];

		let replacement = "";
		if (value !== undefined && value !== null) {
			if (typeof value !== "object" && typeof value !== "function") {
				replacement = String(value);
			}
		}

		return { replacement, newIndex: endIndex + 2 };
	}
}
