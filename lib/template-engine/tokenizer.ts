export const TOKENS = {
	block: (name: string) => {
		return { name, type: "block" } as const;
	},
	dot: () => {
		return { type: "dot" } as const;
	},
	else: () => {
		return { type: "else" } as const;
	},
	endblock: () => {
		return { type: "endblock" } as const;
	},
	endfor: () => {
		return { type: "endfor" } as const;
	},
	endif: () => {
		return { type: "endif" } as const;
	},
	extends: (template: string) => {
		return { template, type: "extends" } as const;
	},
	for: (iterator: string, collection: string) => {
		return { collection, iterator, type: "for" } as const;
	},
	identifier: (name: string) => {
		return { name, type: "identifier" } as const;
	},
	if: (condition: string) => {
		return { condition, type: "if" } as const;
	},
	lparen: () => {
		return { type: "lparen" } as const;
	},
	number: (value: number) => {
		return { type: "number", value } as const;
	},
	rparen: () => {
		return { type: "rparen" } as const;
	},
	string: (value: string) => {
		return { type: "string", value } as const;
	},
	text: (value: string) => {
		return { type: "text", value } as const;
	},
	variable: () => {
		return { type: "variable" } as const;
	},
} as const;

export type Token = ReturnType<(typeof TOKENS)[keyof typeof TOKENS]>;

export class Tokenizer {
	tokenize(template: string): readonly Token[] {
		const tokens: Token[] = [];
		let index = 0;

		while (index < template.length) {
			if (template.startsWith("{% extends", index)) {
				const endIndex = template.indexOf("%}", index);

				if (endIndex === -1) {
					throw new Error(
						`Unclosed {% extends %} tag starting at index ${index}`,
					);
				}

				const layoutName = template
					.slice(index + "{% extends".length, endIndex)
					.trim()
					.replaceAll('"', "")

					.replaceAll("'", "");

				tokens.push({ template: layoutName, type: "extends" });

				index = endIndex + 2;
				continue;
			}

			if (template.startsWith("{% block", index)) {
				const endIndex = template.indexOf("%}", index);

				if (endIndex === -1) {
					throw new Error(
						`Unclosed {% block %} tag starting at index ${index}`,
					);
				}

				const blockName = template
					.slice(index + "{% block".length, endIndex)
					.trim();

				tokens.push({ name: blockName, type: "block" });

				index = endIndex + 2;
				continue;
			}

			if (template.startsWith("{% endblock", index)) {
				const endIndex = template.indexOf("%}", index);

				if (endIndex === -1) {
					throw new Error(
						`Unclosed {% endblock %} tag starting at index ${index}`,
					);
				}

				tokens.push({ type: "endblock" });

				index = endIndex + 2;
				continue;
			}

			if (template.startsWith("{% if", index)) {
				const endIndex = template.indexOf("%}", index);

				if (endIndex === -1) {
					throw new Error(`Unclosed {% if %} tag starting at index ${index}`);
				}

				const condition = template.slice(index + 5, endIndex).trim();
				tokens.push({ condition, type: "if" });

				index = endIndex + 2;
				continue;
			}

			if (template.startsWith("{% else", index)) {
				const endIndex = template.indexOf("%}", index);

				if (endIndex === -1) {
					throw new Error(`Unclosed {% else %} tag starting at index ${index}`);
				}

				tokens.push({ type: "else" });

				index = endIndex + 2;
				continue;
			}

			if (template.startsWith("{% endif", index)) {
				const endIndex = template.indexOf("%}", index);

				if (endIndex === -1) {
					throw new Error(
						`Unclosed {% endif %} tag starting at index ${index}`,
					);
				}

				tokens.push({ type: "endif" });

				index = endIndex + 2;
				continue;
			}

			if (template[index] === "{" && template[index + 1] === "{") {
				const { token, nextIndex, extraTokens } = this.#extractVariableToken(
					template,
					index,
				);

				tokens.push(token);

				if (extraTokens) {
					tokens.push(...extraTokens);
				}

				index = nextIndex;
				continue;
			}

			if (template.startsWith("{% for", index)) {
				const endIndex = template.indexOf("%}", index);

				if (endIndex === -1) {
					throw new Error("Unclosed {% for %} block in template.");
				}

				const loopContent = template
					.slice(index + "{% for".length, endIndex)
					.trim();

				const parts = loopContent.split(/\s+/);

				if (parts.length !== 3 || parts[1] !== "in") {
					throw new Error(
						"Invalid syntax in {% for %} tag. Use '{% for item in collection %}'.",
					);
				}
				const [iterator = "", , collection = ""] = parts;

				tokens.push({ collection, iterator, type: "for" });
				index = endIndex + 2;
				continue;
			}

			if (template.startsWith("{% endfor", index)) {
				const endIndex = template.indexOf("%}", index);

				if (endIndex === -1) {
					throw new Error(
						`Unclosed {% endfor %} tag starting at index ${index}`,
					);
				}

				tokens.push({ type: "endfor" });

				index = endIndex + 2;
				continue;
			}

			const { token, nextIndex } = this.#extractTextToken(template, index);

			if (token) {
				tokens.push(token);
			}

			index = nextIndex;
		}

		return tokens;
	}

	#extractVariableToken(template: string, startIndex: number) {
		const endIndex = template.indexOf("}}", startIndex);

		if (endIndex === -1) {
			const remainder = template.slice(startIndex);

			const closingCount = (remainder.match(/}/g) ?? []).length;

			if (closingCount === 0) {
				throw new Error(
					`Unclosed variable tag starting at index ${startIndex}`,
				);
			}

			return {
				nextIndex: template.length,
				token: { type: "text", value: remainder } satisfies Token,
			};
		}

		const variable = template.slice(startIndex + 2, endIndex).trim();

		const exprTokens = this.#tokenizeExpression(variable);

		return {
			extraTokens: exprTokens,
			nextIndex: endIndex + 2,
			token: { type: "variable" } satisfies Token,
		};
	}

	#extractTextToken(template: string, startIndex: number) {
		const nextControlIndex = template.indexOf("{%", startIndex);
		const nextVariableIndex = template.indexOf("{{", startIndex);
		const endIndex = Math.min(
			nextControlIndex === -1 ? template.length : nextControlIndex,
			nextVariableIndex === -1 ? template.length : nextVariableIndex,
		);

		const text = template.slice(startIndex, endIndex);
		const token: Token = { type: "text", value: text };

		return { nextIndex: endIndex, token };
	}

	#tokenizeExpression(input: string): readonly Token[] {
		const tokens: Token[] = [];
		let i = 0;

		while (i < input.length) {
			const char = input[i];

			if (!char) {
				throw new Error("Unknown character");
			}

			if (/\s/.test(char)) {
				i++;
				continue;
			}

			if (/[a-zA-Z_]/.test(char)) {
				let ident = "";

				while (i < input.length && /[a-zA-Z0-9_]/.test(input[i] ?? "")) {
					ident += input[i++];
				}

				tokens.push({ name: ident, type: "identifier" });
				continue;
			}

			if (char === ".") {
				tokens.push({ type: "dot" });
				i++;

				continue;
			}

			if (char === "[") {
				i++;
				if (i >= input.length) {
					throw new Error(`Unclosed bracket expression: ${input}`);
				}

				if (input[i] === "'" || input[i] === '"') {
					const quote = input[i++];
					let str = "";

					while (i < input.length && input[i] !== quote) {
						str += input[i++];
					}

					if (i >= input.length) {
						throw new Error(`Unclosed string in bracket: ${input}`);
					}

					i++;

					if (input[i] !== "]") {
						throw new Error(`Missing closing bracket in: ${input}`);
					}

					i++;

					tokens.push({ type: "string", value: str });
					continue;
				}

				if (/[0-9]/.test(input[i] ?? "")) {
					let num = "";

					while (i < input.length && /[0-9]/.test(input[i] ?? "")) {
						num += input[i++];
					}

					if (input[i] !== "]") {
						throw new Error(`Missing closing bracket in: ${input}`);
					}

					i++;

					tokens.push({ type: "number", value: Number(num) });
					continue;
				}

				throw new Error(`Unexpected bracket content in: ${input}`);
			}

			if (/[0-9]/.test(char)) {
				let num = "";

				while (i < input.length && /[0-9]/.test(input[i] ?? "")) {
					num += input[i++];
				}

				tokens.push({ type: "number", value: Number(num) });
				continue;
			}

			if (char === "'" || char === '"') {
				const quote = input[i++];
				let str = "";

				while (i < input.length && input[i] !== quote) {
					str += input[i++];
				}

				if (i >= input.length) {
					throw new Error(`Unclosed string literal: ${input}`);
				}

				i++;
				tokens.push({ type: "string", value: str });
				continue;
			}

			throw new Error(`Unexpected character '${char}' in expression: ${input}`);
		}

		return tokens;
	}
}
