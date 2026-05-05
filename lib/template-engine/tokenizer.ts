import {
	type SourceSpan,
	TemplateSyntaxError,
} from "./template-syntax-error.js";

export type Keyword =
	| "extends"
	| "block"
	| "endblock"
	| "if"
	| "else"
	| "endif"
	| "for"
	| "in"
	| "endfor"
	| "attr";

export type Token =
	| { readonly type: "text"; readonly value: string; readonly span: SourceSpan }
	| { readonly type: "openVariable"; readonly span: SourceSpan }
	| { readonly type: "closeVariable"; readonly span: SourceSpan }
	| { readonly type: "openDirective"; readonly span: SourceSpan }
	| { readonly type: "closeDirective"; readonly span: SourceSpan }
	| {
			readonly type: "keyword";
			readonly value: Keyword;
			readonly span: SourceSpan;
	  }
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
			readonly value: number;
			readonly span: SourceSpan;
	  }
	| {
			readonly type: "attrDirective";
			readonly value: string;
			readonly span: SourceSpan;
	  }
	| { readonly type: "dot"; readonly span: SourceSpan }
	| { readonly type: "leftBracket"; readonly span: SourceSpan }
	| { readonly type: "rightBracket"; readonly span: SourceSpan };

function toKeyword(value: string): Keyword | undefined {
	switch (value) {
		case "extends":
		case "block":
		case "endblock":
		case "if":
		case "else":
		case "endif":
		case "for":
		case "in":
		case "endfor":
		case "attr":
			return value;
		default:
			return undefined;
	}
}

export class Tokenizer {
	tokenize(template: string): readonly Token[] {
		const tokens: Token[] = [];
		let index = 0;

		while (index < template.length) {
			const oldIndex = index;

			if (template.startsWith("{{", index)) {
				const closeIndex = template.indexOf("}}", index + 2);

				if (closeIndex === -1) {
					throw new TemplateSyntaxError("Unclosed variable tag", {
						span: { end: template.length, start: index },
					});
				}

				tokens.push({
					span: { end: index + 2, start: index },
					type: "openVariable",
				});
				tokens.push(
					...this.#tokenizeExpressionContent(
						template.slice(index + 2, closeIndex),
						index + 2,
					),
				);
				tokens.push({
					span: { end: closeIndex + 2, start: closeIndex },
					type: "closeVariable",
				});

				index = closeIndex + 2;
			} else if (template.startsWith("{%", index)) {
				const closeIndex = template.indexOf("%}", index + 2);

				if (closeIndex === -1) {
					throw new TemplateSyntaxError("Unclosed directive tag", {
						span: { end: template.length, start: index },
					});
				}

				const directiveContent = template.slice(index + 2, closeIndex);

				tokens.push({
					span: { end: index + 2, start: index },
					type: "openDirective",
				});
				tokens.push(
					...this.#tokenizeDirectiveContent(directiveContent, index + 2),
				);
				tokens.push({
					span: { end: closeIndex + 2, start: closeIndex },
					type: "closeDirective",
				});

				index = closeIndex + 2;
			} else {
				const nextVariableIndex = template.indexOf("{{", index);
				const nextDirectiveIndex = template.indexOf("{%", index);
				const endIndex = Math.min(
					nextVariableIndex === -1 ? template.length : nextVariableIndex,
					nextDirectiveIndex === -1 ? template.length : nextDirectiveIndex,
				);

				tokens.push({
					span: { end: endIndex, start: index },
					type: "text",
					value: template.slice(index, endIndex),
				});

				index = endIndex;
			}

			if (index <= oldIndex) {
				throw new Error(`Tokenizer failed to advance at index ${oldIndex}`);
			}
		}

		return tokens;
	}

	#tokenizeDirectiveContent(
		input: string,
		sourceOffset: number,
	): readonly Token[] {
		if (/^\s*attr(?:\s|$)/.test(input)) {
			return this.#tokenizeAttrDirective(input, sourceOffset);
		}

		return this.#tokenizeExpressionContent(input, sourceOffset);
	}

	#tokenizeAttrDirective(
		input: string,
		sourceOffset: number,
	): readonly Token[] {
		const match = input.match(/^(\s*)attr(?:\s+([\s\S]*?))?\s*$/);

		if (!match) {
			throw new TemplateSyntaxError("Invalid attr directive", {
				span: { end: sourceOffset + input.length, start: sourceOffset },
			});
		}

		const leadingWhitespace = match[1] ?? "";
		const rawDirective = match[2] ?? "";
		const keywordStart = sourceOffset + leadingWhitespace.length;
		const directiveValue = rawDirective.trim();
		const directiveStartInInput =
			directiveValue.length === 0
				? input.length
				: input.indexOf(directiveValue);
		const directiveStart =
			sourceOffset +
			Math.max(directiveStartInInput, leadingWhitespace.length + 4);

		return [
			{
				span: { end: keywordStart + "attr".length, start: keywordStart },
				type: "keyword",
				value: "attr",
			},
			{
				span: {
					end: directiveStart + directiveValue.length,
					start: directiveStart,
				},
				type: "attrDirective",
				value: directiveValue,
			},
		];
	}

	#tokenizeExpressionContent(
		input: string,
		sourceOffset: number,
	): readonly Token[] {
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

				const keyword = toKeyword(value);

				if (keyword) {
					tokens.push({
						span: { end: sourceOffset + index, start: sourceOffset + start },
						type: "keyword",
						value: keyword,
					});
				} else {
					tokens.push({
						span: { end: sourceOffset + index, start: sourceOffset + start },
						type: "identifier",
						value,
					});
				}

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
					value: Number(raw),
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
