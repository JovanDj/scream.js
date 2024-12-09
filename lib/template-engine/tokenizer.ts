export type Token = {
	type: "text" | "variable" | "if" | "else" | "endif";
	value: string;
};

export class Tokenizer {
	tokenize(template: string) {
		const tokens: Token[] = [];
		let index = 0;

		while (index < template.length) {
			if (template.startsWith("{% if", index)) {
				const { token, nextIndex } = this.#extractConditionToken(
					template,
					index,
				);
				tokens.push(token);
				index = nextIndex;
				continue;
			}

			if (template.startsWith("{% else %}", index)) {
				const { token, nextIndex } = this.#extractElseToken(index);
				tokens.push(token);
				index = nextIndex;
				continue;
			}

			if (template.startsWith("{% endif %}", index)) {
				const { token, nextIndex } = this.#extractEndIfToken(index);
				tokens.push(token);
				index = nextIndex;
				continue;
			}

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

	#extractConditionToken(template: string, startIndex: number) {
		const endIndex = template.indexOf("%}", startIndex);
		const condition = template.slice(startIndex + 5, endIndex).trim();
		const token: Token = { type: "if", value: condition };

		return {
			nextIndex: endIndex + 2,
			token,
		};
	}

	#extractElseToken(startIndex: number) {
		const token: Token = { type: "else", value: "" };

		return {
			nextIndex: startIndex + 10,
			token,
		};
	}

	#extractEndIfToken(startIndex: number) {
		const token: Token = { type: "endif", value: "" };

		return {
			nextIndex: startIndex + 11,
			token,
		};
	}

	#isVariableStart(template: string, index: number) {
		return template[index] === "{" && template[index + 1] === "{";
	}

	#extractVariableToken(template: string, startIndex: number) {
		const endIndex = template.indexOf("}}", startIndex);
		if (endIndex === -1) {
			const token: Token = {
				type: "text",
				value: template.slice(startIndex),
			};

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
		const nextControlIndex = template.indexOf("{%", startIndex);
		const nextVariableIndex = template.indexOf("{{", startIndex);
		const endIndex = Math.min(
			nextControlIndex === -1 ? template.length : nextControlIndex,
			nextVariableIndex === -1 ? template.length : nextVariableIndex,
		);

		const token: Token = {
			type: "text",
			value: template.slice(startIndex, endIndex),
		};

		return {
			nextIndex: endIndex,
			token,
		};
	}
}
