import {
	type SourceSpan,
	TemplateSyntaxError,
} from "./template-syntax-error.js";

export type Token =
	| { readonly type: "text"; readonly value: string; readonly span: SourceSpan }
	| { readonly type: "openVariable"; readonly span: SourceSpan }
	| { readonly type: "closeVariable"; readonly span: SourceSpan }
	| { readonly type: "openDirective"; readonly span: SourceSpan }
	| { readonly type: "closeDirective"; readonly span: SourceSpan }
	| {
			readonly type: "identifier";
			readonly value: string;
			readonly span: SourceSpan;
	  }
	| {
			readonly type: "string";
			readonly value: string;
			readonly span: SourceSpan;
	  }
	| {
			readonly type: "number";
			readonly value: string;
			readonly span: SourceSpan;
	  }
	| { readonly type: "equals"; readonly span: SourceSpan }
	| { readonly type: "dash"; readonly span: SourceSpan }
	| { readonly type: "colon"; readonly span: SourceSpan }
	| { readonly type: "dot"; readonly span: SourceSpan }
	| { readonly type: "leftBracket"; readonly span: SourceSpan }
	| { readonly type: "rightBracket"; readonly span: SourceSpan };

type TokenizeResult = {
	readonly tokens: readonly Token[];
	readonly nextIndex: number;
};

export class Tokenizer {
	tokenize(template: string): readonly Token[] {
		const tokens: Token[] = [];
		let index = 0;

		while (index < template.length) {
			const oldIndex = index;
			const result = this.#tokenizeAt(template, index);

			tokens.push(...result.tokens);
			index = result.nextIndex;

			if (index <= oldIndex) {
				throw new Error(`Tokenizer failed to advance at index ${oldIndex}`);
			}
		}

		return tokens;
	}

	#tokenizeAt(template: string, index: number): TokenizeResult {
		if (template.startsWith("{{", index)) {
			return this.#tokenizeVariableTag(template, index);
		}

		if (template.startsWith("{%", index)) {
			return this.#tokenizeDirectiveTag(template, index);
		}

		return this.#tokenizeText(template, index);
	}

	#tokenizeVariableTag(template: string, index: number): TokenizeResult {
		const closeIndex = this.#findTagEnd(template, index + 2, "}}");

		if (closeIndex === -1) {
			throw new TemplateSyntaxError("Unclosed variable tag", {
				span: { end: template.length, start: index },
			});
		}

		return {
			nextIndex: closeIndex + 2,
			tokens: [
				{
					span: { end: index + 2, start: index },
					type: "openVariable",
				},
				...this.#tokenizeTagContent(
					template.slice(index + 2, closeIndex),
					index + 2,
				),
				{
					span: { end: closeIndex + 2, start: closeIndex },
					type: "closeVariable",
				},
			],
		};
	}

	#tokenizeDirectiveTag(template: string, index: number): TokenizeResult {
		const closeIndex = this.#findTagEnd(template, index + 2, "%}");

		if (closeIndex === -1) {
			throw new TemplateSyntaxError("Unclosed directive tag", {
				span: { end: template.length, start: index },
			});
		}

		return {
			nextIndex: closeIndex + 2,
			tokens: [
				{
					span: { end: index + 2, start: index },
					type: "openDirective",
				},
				...this.#tokenizeTagContent(
					template.slice(index + 2, closeIndex),
					index + 2,
				),
				{
					span: { end: closeIndex + 2, start: closeIndex },
					type: "closeDirective",
				},
			],
		};
	}

	#tokenizeText(template: string, index: number): TokenizeResult {
		const nextVariableIndex = template.indexOf("{{", index);
		const nextDirectiveIndex = template.indexOf("{%", index);
		const endIndex = Math.min(
			nextVariableIndex === -1 ? template.length : nextVariableIndex,
			nextDirectiveIndex === -1 ? template.length : nextDirectiveIndex,
		);

		return {
			nextIndex: endIndex,
			tokens: [
				{
					span: { end: endIndex, start: index },
					type: "text",
					value: template.slice(index, endIndex),
				},
			],
		};
	}

	#findTagEnd(template: string, start: number, delimiter: string): number {
		let index = start;

		while (index < template.length) {
			const char = template[index];

			if (char === '"' || char === "'") {
				const closeQuote = template.indexOf(char, index + 1);

				if (closeQuote === -1) {
					throw new TemplateSyntaxError("Unclosed string literal", {
						span: { end: template.length, start: index },
					});
				}

				index = closeQuote + 1;
				continue;
			}

			if (template.startsWith(delimiter, index)) {
				return index;
			}

			index++;
		}

		return -1;
	}

	#tokenizeTagContent(input: string, sourceOffset: number): readonly Token[] {
		const tokens: Token[] = [];
		let index = 0;

		while (index < input.length) {
			const char = input[index];

			if (!char) {
				throw new TemplateSyntaxError("Unknown character");
			}

			if (/\s/.test(char)) {
				index++;
				continue;
			}

			if (/[a-zA-Z_]/.test(char)) {
				const start = index;
				let value = "";

				while (
					index < input.length &&
					/[a-zA-Z0-9_]/.test(input[index] ?? "")
				) {
					value += input[index++];
				}

				tokens.push({
					span: { end: sourceOffset + index, start: sourceOffset + start },
					type: "identifier",
					value,
				});
				continue;
			}

			if (/[0-9]/.test(char)) {
				const start = index;
				let raw = "";

				while (index < input.length && /[0-9]/.test(input[index] ?? "")) {
					raw += input[index++];
				}

				tokens.push({
					span: { end: sourceOffset + index, start: sourceOffset + start },
					type: "number",
					value: raw,
				});
				continue;
			}

			if (char === "'" || char === '"') {
				const start = index;
				const quote = input[index++];
				let value = "";

				while (index < input.length && input[index] !== quote) {
					value += input[index++];
				}

				if (input[index] !== quote) {
					throw new TemplateSyntaxError("Unclosed string literal", {
						span: {
							end: sourceOffset + input.length,
							start: sourceOffset + start,
						},
					});
				}

				index++;
				tokens.push({
					span: { end: sourceOffset + index, start: sourceOffset + start },
					type: "string",
					value,
				});
				continue;
			}

			if (char === ".") {
				tokens.push({
					span: { end: sourceOffset + index + 1, start: sourceOffset + index },
					type: "dot",
				});
				index++;
				continue;
			}

			if (char === "=") {
				tokens.push({
					span: { end: sourceOffset + index + 1, start: sourceOffset + index },
					type: "equals",
				});
				index++;
				continue;
			}

			if (char === "-") {
				tokens.push({
					span: { end: sourceOffset + index + 1, start: sourceOffset + index },
					type: "dash",
				});
				index++;
				continue;
			}

			if (char === ":") {
				tokens.push({
					span: { end: sourceOffset + index + 1, start: sourceOffset + index },
					type: "colon",
				});
				index++;
				continue;
			}

			if (char === "[") {
				tokens.push({
					span: { end: sourceOffset + index + 1, start: sourceOffset + index },
					type: "leftBracket",
				});
				index++;
				continue;
			}

			if (char === "]") {
				tokens.push({
					span: { end: sourceOffset + index + 1, start: sourceOffset + index },
					type: "rightBracket",
				});
				index++;
				continue;
			}

			throw new TemplateSyntaxError(`Unexpected character '${char}'`, {
				span: { end: sourceOffset + index + 1, start: sourceOffset + index },
			});
		}

		return tokens;
	}
}
