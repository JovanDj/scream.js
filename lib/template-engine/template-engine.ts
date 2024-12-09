type Token = {
	type: "text" | "variable";
	value: string;
};

export class ScreamTemplateEngine {
	compile(template: string, context: Record<string, unknown>) {
		const tokens = this.#tokenize(template);
		return this.#render(tokens, context);
	}

	#tokenize(template: string) {
		const tokens: Token[] = [];
		let index = 0;

		while (index < template.length) {
			if (this.#isVariableStart(template, index)) {
				const { token, nextIndex } = this.#extractVariableToken(
					template,
					index,
				);
				tokens.push(token);
				index = nextIndex;
				continue;
			}

			const { token, nextIndex } = this.#extractTextToken(template, index);
			tokens.push(token);
			index = nextIndex;
		}

		return tokens;
	}

	#isVariableStart(template: string, index: number) {
		return template[index] === "{" && template[index + 1] === "{";
	}

	#extractVariableToken(template: string, startIndex: number) {
		const endIndex = template.indexOf("}}", startIndex);
		if (endIndex === -1) {
			const token: Token = { type: "text", value: template.slice(startIndex) };

			return {
				nextIndex: template.length,
				token,
			};
		}

		const variable = template.slice(startIndex + 2, endIndex).trim();
		const token: Token = { type: "variable", value: variable || "" };

		return {
			nextIndex: endIndex + 2,
			token,
		};
	}

	#extractTextToken(template: string, startIndex: number) {
		const nextVariableIndex = template.indexOf("{{", startIndex);
		const endIndex =
			nextVariableIndex === -1 ? template.length : nextVariableIndex;

		const token: Token = {
			type: "text",
			value: template.slice(startIndex, endIndex),
		};

		return {
			nextIndex: endIndex,
			token,
		};
	}

	#render(tokens: Token[], context: Record<string, unknown>) {
		return tokens.map((token) => this.#renderToken(token, context)).join("");
	}

	#renderToken(token: Token, context: Record<string, unknown>) {
		if (token.type === "text") {
			return token.value;
		}

		const variableValue = context[token.value];
		if (
			token.value === "" ||
			variableValue === undefined ||
			variableValue === null
		) {
			return "";
		}

		if (
			typeof variableValue === "object" ||
			typeof variableValue === "function"
		) {
			return "";
		}

		return this.#escape(String(variableValue));
	}

	#escape(value: string) {
		if (/&(?:amp|lt|gt|quot|#39);/.test(value)) {
			return value;
		}

		return value
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}
}
