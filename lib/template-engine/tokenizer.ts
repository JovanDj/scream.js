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

export class TokenizerError extends Error {
	override readonly name = "TokenizerError";
	readonly templateName: string;
	readonly line: number;
	readonly column: number;
	readonly snippet: string;

	constructor(options: {
		message: string;
		templateName: string;
		line: number;
		column: number;
		snippet: string;
	}) {
		super(options.message);
		Object.setPrototypeOf(this, new.target.prototype);
		this.templateName = options.templateName;
		this.line = options.line;
		this.column = options.column;
		this.snippet = options.snippet;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, TokenizerError);
		}
	}
}

export class Tokenizer {
	tokenize(template: string, templateName: string): readonly Token[] {
		const tokens: Token[] = [];
		let index = 0;

		while (index < template.length) {
			if (template.startsWith("{% extends", index)) {
				const endIndex = template.indexOf("%}", index);

				if (endIndex === -1) {
					this.#fail(
						"Unclosed {% extends %} tag",
						template,
						templateName,
						index,
					);
				}

				const layoutName = template.slice(
					index + "{% extends".length,
					endIndex,
				);

				tokens.push({ template: layoutName, type: "extends" });

				index = endIndex + 2;
				continue;
			}

			if (template.startsWith("{% block", index)) {
				const endIndex = template.indexOf("%}", index);

				if (endIndex === -1) {
					this.#fail("Unclosed {% block %} tag", template, templateName, index);
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
					this.#fail(
						"Unclosed {% endblock %} tag",
						template,
						templateName,
						index,
					);
				}

				tokens.push({ type: "endblock" });

				index = endIndex + 2;
				continue;
			}

			if (template.startsWith("{% if", index)) {
				const endIndex = template.indexOf("%}", index);

				if (endIndex === -1) {
					this.#fail("Unclosed {% if %} tag", template, templateName, index);
				}

				const condition = template.slice(index + 5, endIndex).trim();
				tokens.push({ condition, type: "if" });

				index = endIndex + 2;
				continue;
			}

			if (template.startsWith("{% else", index)) {
				const endIndex = template.indexOf("%}", index);

				if (endIndex === -1) {
					this.#fail("Unclosed {% else %} tag", template, templateName, index);
				}

				tokens.push({ type: "else" });

				index = endIndex + 2;
				continue;
			}

			if (template.startsWith("{% endif", index)) {
				const endIndex = template.indexOf("%}", index);

				if (endIndex === -1) {
					this.#fail("Unclosed {% endif %} tag", template, templateName, index);
				}

				tokens.push({ type: "endif" });

				index = endIndex + 2;
				continue;
			}

			if (template.startsWith("{% for", index)) {
				const endIndex = template.indexOf("%}", index);

				if (endIndex === -1) {
					this.#fail("Unclosed {% for %} block", template, templateName, index);
				}

				const loopContent = template
					.slice(index + "{% for".length, endIndex)
					.trim();

				const parts = loopContent.split(/\s+/);

				if (parts.length !== 3 || parts[1] !== "in") {
					this.#fail(
						"Invalid syntax in {% for %} tag. Use '{% for item in collection %}'.",
						template,
						templateName,
						index,
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
					this.#fail(
						"Unclosed {% endfor %} tag",
						template,
						templateName,
						index,
					);
				}

				tokens.push({ type: "endfor" });

				index = endIndex + 2;
				continue;
			}

			if (template.startsWith("{%", index)) {
				const endIndex = template.indexOf("%}", index);
				if (endIndex === -1) {
					this.#fail("Unclosed control tag", template, templateName, index);
				}

				this.#fail("Unknown control tag", template, templateName, index);
			}

			if (template.startsWith("}}", index)) {
				this.#fail(
					"Unexpected closing variable delimiter '}}'",
					template,
					templateName,
					index,
				);
			}

			if (template.startsWith("%}", index)) {
				this.#fail(
					"Unexpected closing control delimiter '%}'",
					template,
					templateName,
					index,
				);
			}

			if (template[index] === "{" && template[index + 1] === "{") {
				const { token, nextIndex, extraTokens } = this.#extractVariableToken(
					template,
					templateName,
					index,
				);

				tokens.push(token);
				if (extraTokens) {
					tokens.push(...extraTokens);
				}

				index = nextIndex;
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

	#fail(
		message: string,
		template: string,
		templateName: string,
		index: number,
	): never {
		const { column, line, snippet } = this.#position(template, index);

		throw new TokenizerError({
			column,
			line,
			message,
			snippet,
			templateName,
		});
	}

	#extractVariableToken(
		template: string,
		templateName: string,
		startIndex: number,
	) {
		const endIndex = template.indexOf("}}", startIndex);

		if (endIndex === -1) {
			this.#fail(
				`Unclosed variable tag starting at index ${startIndex}`,
				template,
				templateName,
				startIndex,
			);
		}

		const rawExpr = template.slice(startIndex + 2, endIndex);
		const trimmedStart = rawExpr.trimStart();
		const leadingWhitespace = rawExpr.length - trimmedStart.length;
		const variable = trimmedStart.trimEnd();

		if (variable.length === 0) {
			this.#fail(
				"Variable expression cannot be empty",
				template,
				templateName,
				startIndex,
			);
		}

		const exprTokens = this.#tokenizeExpression(
			variable,
			startIndex + 2 + leadingWhitespace,
			{
				template,
				templateName,
			},
		);

		return {
			extraTokens: exprTokens,
			nextIndex: endIndex + 2,
			token: { type: "variable" } satisfies Token,
		};
	}

	#extractTextToken(template: string, startIndex: number) {
		const nextControlIndex = template.indexOf("{%", startIndex);
		const nextVariableIndex = template.indexOf("{{", startIndex);
		const nextVariableCloseIndex = template.indexOf("}}", startIndex);
		const nextControlCloseIndex = template.indexOf("%}", startIndex);
		const endIndex = Math.min(
			nextControlIndex === -1 ? template.length : nextControlIndex,
			nextVariableIndex === -1 ? template.length : nextVariableIndex,
			nextVariableCloseIndex === -1 ? template.length : nextVariableCloseIndex,
			nextControlCloseIndex === -1 ? template.length : nextControlCloseIndex,
		);

		const text = template.slice(startIndex, endIndex);
		const token: Token = { type: "text", value: text };

		return { nextIndex: endIndex, token };
	}

	#position(template: string, index: number) {
		let line = 1;
		let lineStart = 0;
		let i = 0;

		while (i < index) {
			const char = template[i];
			if (char === "\r" && template[i + 1] === "\n") {
				i++;
				line++;
				lineStart = i + 1;
				i++;
				continue;
			}

			if (char === "\n") {
				line++;
				lineStart = i + 1;
			}

			i++;
		}

		let lineEnd = template.indexOf("\n", lineStart);
		if (lineEnd === -1) {
			lineEnd = template.length;
		}

		const snippet = template.slice(lineStart, lineEnd).replace(/\r$/, "");
		const column = index - lineStart + 1;

		return { column, line, snippet };
	}

	#tokenizeExpression(
		input: string,
		baseIndex: number,
		options: { readonly template: string; readonly templateName: string },
	): readonly Token[] {
		const tokens: Token[] = [];
		let i = 0;

		while (i < input.length) {
			const currentChar = input[i];

			if (currentChar === undefined) {
				this.#fail(
					"Unexpected end of expression",
					options.template,
					options.templateName,
					baseIndex + i,
				);
			}

			if (/\s/.test(currentChar)) {
				i++;
				continue;
			}

			if (/[a-zA-Z_]/.test(currentChar)) {
				let ident = "";

				while (i < input.length && /[a-zA-Z0-9_]/.test(input[i] ?? "")) {
					const current = input[i];
					if (current === undefined) {
						break;
					}

					ident += current;
					i++;
				}

				tokens.push({ name: ident, type: "identifier" });
				continue;
			}

			if (currentChar === ".") {
				tokens.push({ type: "dot" });
				i++;
				continue;
			}

			if (currentChar === "[") {
				i++;
				if (i >= input.length) {
					this.#fail(
						"Unclosed bracket expression",
						options.template,
						options.templateName,
						baseIndex + i,
					);
				}

				if (input[i] === "'" || input[i] === '"') {
					const quote = input[i];
					if (quote === undefined) {
						this.#fail(
							"Unclosed bracket expression",
							options.template,
							options.templateName,
							baseIndex + i,
						);
					}

					i++;
					let str = "";

					while (i < input.length && input[i] !== quote) {
						const charInString = input[i];
						if (charInString === undefined) {
							break;
						}

						str += charInString;
						i++;
					}

					if (i >= input.length) {
						this.#fail(
							"Unclosed string in bracket",
							options.template,
							options.templateName,
							baseIndex + i,
						);
					}

					i++;

					if (input[i] !== "]") {
						this.#fail(
							"Missing closing bracket",
							options.template,
							options.templateName,
							baseIndex + i,
						);
					}

					i++;

					tokens.push({ type: "string", value: str });
					continue;
				}

				if (/[0-9]/.test(input[i] ?? "")) {
					let num = "";

					while (i < input.length && /[0-9]/.test(input[i] ?? "")) {
						const digit = input[i];
						if (digit === undefined) {
							break;
						}

						num += digit;
						i++;
					}

					if (input[i] !== "]") {
						this.#fail(
							"Missing closing bracket",
							options.template,
							options.templateName,
							baseIndex + i,
						);
					}

					i++;

					tokens.push({ type: "number", value: Number(num) });
					continue;
				}

				this.#fail(
					"Unexpected bracket content",
					options.template,
					options.templateName,
					baseIndex + i,
				);
			}

			if (/[0-9]/.test(currentChar)) {
				let num = "";

				while (i < input.length && /[0-9]/.test(input[i] ?? "")) {
					const digit = input[i];
					if (digit === undefined) {
						break;
					}

					num += digit;
					i++;
				}

				tokens.push({ type: "number", value: Number(num) });
				continue;
			}

			if (currentChar === "'" || currentChar === '"') {
				const quote = input[i];
				if (quote === undefined) {
					this.#fail(
						"Unclosed string literal",
						options.template,
						options.templateName,
						baseIndex + i,
					);
				}

				i++;
				let str = "";

				while (i < input.length && input[i] !== quote) {
					const charInString = input[i];
					if (charInString === undefined) {
						break;
					}

					str += charInString;
					i++;
				}

				if (i >= input.length) {
					this.#fail(
						"Unclosed string literal",
						options.template,
						options.templateName,
						baseIndex + i,
					);
				}

				i++;
				tokens.push({ type: "string", value: str });
				continue;
			}

			this.#fail(
				`Unexpected character '${currentChar}' in expression`,
				options.template,
				options.templateName,
				baseIndex + i,
			);
		}

		return tokens;
	}
}
