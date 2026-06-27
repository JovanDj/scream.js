import {
	type SourceSpan,
	TemplateSyntaxError,
} from "./template-syntax-error.js";
import type { Token } from "./tokenizer.js";

export class TemplateScanner {
	readonly #source: string;
	readonly #tokens: Token[] = [];
	#current = 0;
	#start = 0;

	constructor(source: string) {
		this.#source = source;
	}

	scanTokens(): readonly Token[] {
		while (!this.#isAtEnd()) {
			this.#start = this.#current;
			this.#scanToken();

			if (this.#current <= this.#start) {
				throw new Error(`Tokenizer failed to advance at index ${this.#start}`);
			}
		}

		return this.#tokens;
	}

	#scanToken() {
		if (this.#match("{{")) {
			this.#scanVariableTag();
			return;
		}

		if (this.#match("{%")) {
			this.#scanDirectiveTag();
			return;
		}

		this.#scanText();
	}

	#scanVariableTag() {
		const contentStart = this.#current;
		const closeIndex = this.#source.indexOf("}}", this.#current);

		if (closeIndex === -1) {
			throw new TemplateSyntaxError("Unclosed variable tag", {
				span: { end: this.#source.length, start: this.#start },
			});
		}

		this.#addToken("openVariable", this.#start, contentStart);
		this.#tokens.push(
			...new TagScanner(
				this.#source.slice(contentStart, closeIndex),
				contentStart,
			).scanTokens(),
		);
		this.#addToken("closeVariable", closeIndex, closeIndex + 2);
		this.#current = closeIndex + 2;
	}

	#scanDirectiveTag() {
		const contentStart = this.#current;
		const closeIndex = this.#source.indexOf("%}", this.#current);

		if (closeIndex === -1) {
			throw new TemplateSyntaxError("Unclosed directive tag", {
				span: { end: this.#source.length, start: this.#start },
			});
		}

		this.#addToken("openDirective", this.#start, contentStart);
		this.#tokens.push(
			...new TagScanner(
				this.#source.slice(contentStart, closeIndex),
				contentStart,
			).scanTokens(),
		);
		this.#addToken("closeDirective", closeIndex, closeIndex + 2);
		this.#current = closeIndex + 2;
	}

	#scanText() {
		while (!this.#isAtEnd() && !this.#check("{{") && !this.#check("{%")) {
			this.#advance();
		}

		this.#tokens.push({
			span: { end: this.#current, start: this.#start },
			type: "text",
			value: this.#source.slice(this.#start, this.#current),
		});
	}

	#addToken(
		type: "closeDirective" | "closeVariable" | "openDirective" | "openVariable",
		start: number,
		end: number,
	) {
		this.#tokens.push({ span: { end, start }, type });
	}

	#advance() {
		const char = this.#source[this.#current] ?? "";
		this.#current++;

		return char;
	}

	#check(value: string) {
		return this.#source.startsWith(value, this.#current);
	}

	#match(value: string) {
		if (!this.#check(value)) {
			return false;
		}

		this.#current += value.length;
		return true;
	}

	#isAtEnd() {
		return this.#current >= this.#source.length;
	}
}

class TagScanner {
	readonly #source: string;
	readonly #sourceOffset: number;
	readonly #tokens: Token[] = [];
	#current = 0;
	#start = 0;

	constructor(source: string, sourceOffset: number) {
		this.#source = source;
		this.#sourceOffset = sourceOffset;
	}

	scanTokens(): readonly Token[] {
		while (!this.#isAtEnd()) {
			this.#start = this.#current;
			this.#scanToken();
		}

		return this.#tokens;
	}

	#scanToken() {
		const char = this.#advance();

		if (!char) {
			throw new TemplateSyntaxError("Unknown character");
		}

		if (/\s/.test(char)) {
			return;
		}

		if (this.#isWordStart(char)) {
			this.#scanWord();
			return;
		}

		if (char === "'" || char === '"') {
			this.#scanString(char);
			return;
		}

		if (char === ".") {
			this.#addToken("dot");
			return;
		}

		if (char === ",") {
			this.#addToken("comma");
			return;
		}

		if (char === ":") {
			this.#addToken("colon");
			return;
		}

		if (char === "(") {
			this.#addToken("openParen");
			return;
		}

		if (char === ")") {
			this.#addToken("closeParen");
			return;
		}

		throw new TemplateSyntaxError(`Unexpected character '${char}'`, {
			span: this.#span(),
		});
	}

	#scanWord() {
		while (this.#isWordPart(this.#peek())) {
			this.#advance();
		}

		this.#tokens.push({
			span: this.#span(),
			type: "word",
			value: this.#source.slice(this.#start, this.#current),
		});
	}

	#scanString(quote: string) {
		while (!this.#isAtEnd() && this.#peek() !== quote) {
			this.#advance();
		}

		if (this.#isAtEnd()) {
			throw new TemplateSyntaxError("Unclosed string literal", {
				span: {
					end: this.#sourceOffset + this.#source.length,
					start: this.#sourceOffset + this.#start,
				},
			});
		}

		this.#advance();
		this.#tokens.push({
			span: this.#span(),
			type: "string",
			value: this.#source.slice(this.#start + 1, this.#current - 1),
		});
	}

	#addToken(type: "closeParen" | "colon" | "comma" | "dot" | "openParen") {
		this.#tokens.push({ span: this.#span(), type });
	}

	#advance() {
		const char = this.#source[this.#current] ?? "";
		this.#current++;

		return char;
	}

	#peek() {
		return this.#source[this.#current] ?? "";
	}

	#span(): SourceSpan {
		return {
			end: this.#sourceOffset + this.#current,
			start: this.#sourceOffset + this.#start,
		};
	}

	#isAtEnd() {
		return this.#current >= this.#source.length;
	}

	#isWordStart(char: string) {
		return /[a-zA-Z_]/.test(char);
	}

	#isWordPart(char: string) {
		return /[a-zA-Z0-9_]/.test(char);
	}
}
