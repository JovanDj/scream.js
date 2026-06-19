import type { TemplateASTNode } from "./ast.js";
import type { PathExpressionNode } from "./expression.js";
import {
	type SourceSpan,
	TemplateSyntaxError,
} from "./template-syntax-error.js";
import type { Token } from "./tokenizer.js";

type ParseResult = {
	readonly ast: readonly TemplateASTNode[];
	readonly nextIndex: number;
};

type NodeResult = {
	readonly node: TemplateASTNode;
	readonly nextIndex: number;
};

type ClosingDirectiveResult = {
	readonly nextIndex: number;
	readonly span: SourceSpan;
};

export class Parser {
	parse(tokens: readonly Token[]): readonly TemplateASTNode[] {
		const result = this.#parseTemplate(tokens, 0, []);

		if (result.nextIndex !== tokens.length) {
			const token = tokens[result.nextIndex];
			if (token) {
				throw new TemplateSyntaxError("Unexpected trailing syntax", {
					span: token.span,
				});
			}
			throw new TemplateSyntaxError("Unexpected trailing syntax");
		}

		return result.ast;
	}

	#parseTemplate(
		tokens: readonly Token[],
		index: number,
		stopWords: readonly string[],
	): ParseResult {
		const ast: TemplateASTNode[] = [];
		let nextIndex = index;

		while (nextIndex < tokens.length) {
			if (this.#isStopDirective(tokens, nextIndex, stopWords)) {
				return { ast, nextIndex };
			}

			const result = this.#parseNode(tokens, nextIndex);
			ast.push(result.node);
			nextIndex = result.nextIndex;
		}

		if (stopWords.length > 0) {
			throw new TemplateSyntaxError("Unexpected end inside block");
		}

		return { ast, nextIndex };
	}

	#parseNode(tokens: readonly Token[], index: number): NodeResult {
		const token = tokens[index];

		if (!token) {
			throw new TemplateSyntaxError("Unexpected end of input");
		}

		if (token.type === "text") {
			return { nextIndex: index + 1, node: token };
		}

		if (token.type === "openVariable") {
			return this.#parseVariable(tokens, index);
		}

		if (token.type === "openDirective") {
			return this.#parseDirective(tokens, index);
		}

		throw new TemplateSyntaxError(`Unexpected token: ${token.type}`, {
			span: token.span,
		});
	}

	#parseDirective(tokens: readonly Token[], index: number): NodeResult {
		const directive = this.#expectWord(tokens, index + 1);

		if (directive.value === "extends") {
			return this.#parseExtends(tokens, index);
		}

		if (directive.value === "block") {
			return this.#parseBlock(tokens, index);
		}

		if (directive.value === "if") {
			return this.#parseIf(tokens, index);
		}

		if (directive.value === "apply") {
			return this.#parseApply(tokens, index);
		}

		if (directive.value === "template") {
			return this.#parseTemplateDefinition(tokens, index);
		}

		if (directive.value === "include") {
			return this.#parseInclude(tokens, index);
		}

		if (directive.value === "for" || directive.value === "attr") {
			throw new TemplateSyntaxError(
				`Unsupported directive: ${directive.value}`,
				{ span: directive.span },
			);
		}

		if (this.#isClosingDirectiveWord(directive.value)) {
			throw new TemplateSyntaxError(
				`Unexpected directive: ${directive.value}`,
				{
					span: directive.span,
				},
			);
		}

		throw new TemplateSyntaxError("Unknown directive", {
			span: directive.span,
		});
	}

	#parseVariable(tokens: readonly Token[], index: number): NodeResult {
		const open = this.#expectToken(tokens, index, "openVariable");
		const firstExpressionToken = tokens[index + 1];

		if (firstExpressionToken?.type === "closeVariable") {
			throw new TemplateSyntaxError("Empty variable expression", {
				span: { end: firstExpressionToken.span.end, start: open.span.start },
			});
		}

		const { expression, nextIndex } = this.#parsePathExpression(
			tokens,
			index + 1,
			"closeVariable",
		);
		const close = this.#expectToken(tokens, nextIndex, "closeVariable");

		return {
			nextIndex: nextIndex + 1,
			node: {
				expression,
				span: { end: close.span.end, start: open.span.start },
				type: "variable",
			},
		};
	}

	#parseExtends(tokens: readonly Token[], index: number): NodeResult {
		const open = this.#expectToken(tokens, index, "openDirective");
		this.#expectWord(tokens, index + 1, "extends");
		const template = this.#expectToken(tokens, index + 2, "string");
		const close = this.#expectToken(tokens, index + 3, "closeDirective");

		return {
			nextIndex: index + 4,
			node: {
				span: { end: close.span.end, start: open.span.start },
				template: template.value,
				type: "extends",
			},
		};
	}

	#parseBlock(tokens: readonly Token[], index: number): NodeResult {
		const open = this.#expectToken(tokens, index, "openDirective");
		this.#expectWord(tokens, index + 1, "block");
		const name = this.#expectWord(tokens, index + 2);
		this.#expectToken(tokens, index + 3, "closeDirective");

		const children = this.#parseTemplate(tokens, index + 4, ["endblock"]);
		const close = this.#parseClosingDirective(
			tokens,
			children.nextIndex,
			"endblock",
			name.value,
		);

		return {
			nextIndex: close.nextIndex,
			node: {
				children: children.ast,
				name: name.value,
				span: { end: close.span.end, start: open.span.start },
				type: "block",
			},
		};
	}

	#parseIf(tokens: readonly Token[], index: number): NodeResult {
		const open = this.#expectToken(tokens, index, "openDirective");
		this.#expectWord(tokens, index + 1, "if");
		const condition = this.#parsePathExpression(
			tokens,
			index + 2,
			"closeDirective",
		);
		this.#expectToken(tokens, condition.nextIndex, "closeDirective");

		const children = this.#parseTemplate(tokens, condition.nextIndex + 1, [
			"else",
			"endif",
		]);

		if (this.#isStopDirective(tokens, children.nextIndex, ["else"])) {
			const elseClose = this.#parseClosingDirective(
				tokens,
				children.nextIndex,
				"else",
			);
			const alternate = this.#parseTemplate(tokens, elseClose.nextIndex, [
				"endif",
			]);
			const close = this.#parseClosingDirective(
				tokens,
				alternate.nextIndex,
				"endif",
			);

			return {
				nextIndex: close.nextIndex,
				node: {
					alternate: alternate.ast,
					children: children.ast,
					condition: condition.expression,
					span: { end: close.span.end, start: open.span.start },
					type: "if",
				},
			};
		}

		const close = this.#parseClosingDirective(
			tokens,
			children.nextIndex,
			"endif",
		);

		return {
			nextIndex: close.nextIndex,
			node: {
				alternate: [],
				children: children.ast,
				condition: condition.expression,
				span: { end: close.span.end, start: open.span.start },
				type: "if",
			},
		};
	}

	#parseApply(tokens: readonly Token[], index: number): NodeResult {
		const open = this.#expectToken(tokens, index, "openDirective");
		this.#expectWord(tokens, index + 1, "apply");
		const source = this.#parsePathExpression(
			tokens,
			index + 2,
			"closeDirective",
			"to",
		);
		const maybeTo = tokens[source.nextIndex];

		if (maybeTo?.type === "word" && maybeTo.value === "to") {
			const templateReference = tokens[source.nextIndex + 1];
			const close = this.#expectToken(
				tokens,
				source.nextIndex + 2,
				"closeDirective",
			);

			if (templateReference?.type === "string") {
				return {
					nextIndex: source.nextIndex + 3,
					node: {
						children: [],
						source: source.expression,
						span: { end: close.span.end, start: open.span.start },
						templatePath: templateReference.value,
						type: "apply",
					},
				};
			}

			const templateName = this.#expectWord(tokens, source.nextIndex + 1);

			return {
				nextIndex: source.nextIndex + 3,
				node: {
					children: [],
					source: source.expression,
					span: { end: close.span.end, start: open.span.start },
					templateName: templateName.value,
					type: "apply",
				},
			};
		}

		this.#expectToken(tokens, source.nextIndex, "closeDirective");
		const children = this.#parseTemplate(tokens, source.nextIndex + 1, [
			"endapply",
		]);
		const close = this.#parseClosingDirective(
			tokens,
			children.nextIndex,
			"endapply",
		);

		return {
			nextIndex: close.nextIndex,
			node: {
				children: children.ast,
				source: source.expression,
				span: { end: close.span.end, start: open.span.start },
				type: "apply",
			},
		};
	}

	#parseTemplateDefinition(
		tokens: readonly Token[],
		index: number,
	): NodeResult {
		const open = this.#expectToken(tokens, index, "openDirective");
		this.#expectWord(tokens, index + 1, "template");
		const name = this.#expectWord(tokens, index + 2);
		this.#expectToken(tokens, index + 3, "closeDirective");

		const children = this.#parseTemplate(tokens, index + 4, ["endtemplate"]);
		const close = this.#parseClosingDirective(
			tokens,
			children.nextIndex,
			"endtemplate",
		);

		return {
			nextIndex: close.nextIndex,
			node: {
				children: children.ast,
				name: name.value,
				span: { end: close.span.end, start: open.span.start },
				type: "template",
			},
		};
	}

	#parseInclude(tokens: readonly Token[], index: number): NodeResult {
		const open = this.#expectToken(tokens, index, "openDirective");
		this.#expectWord(tokens, index + 1, "include");
		const template = this.#expectToken(tokens, index + 2, "string");
		const close = this.#expectToken(tokens, index + 3, "closeDirective");

		return {
			nextIndex: index + 4,
			node: {
				span: { end: close.span.end, start: open.span.start },
				template: template.value,
				type: "include",
			},
		};
	}

	#parsePathExpression(
		tokens: readonly Token[],
		index: number,
		stopTokenType: "closeVariable" | "closeDirective",
		stopWord?: string,
	): { expression: PathExpressionNode; nextIndex: number } {
		const maybeStop = tokens[index];
		if (
			maybeStop?.type === stopTokenType ||
			(maybeStop?.type === "word" && maybeStop.value === stopWord)
		) {
			throw new TemplateSyntaxError("Empty expression", {
				span: maybeStop.span,
			});
		}

		const first = this.#expectPathSegment(tokens, index);
		const segments = [first.value];
		let lastSpan = first.span;
		let nextIndex = index + 1;

		while (nextIndex < tokens.length) {
			const token = tokens[nextIndex];

			if (!token) {
				throw new TemplateSyntaxError("Unexpected end in expression");
			}

			if (token.type === stopTokenType) {
				return {
					expression: {
						segments,
						span: { end: lastSpan.end, start: first.span.start },
						type: "path",
					},
					nextIndex,
				};
			}

			if (token.type === "word" && token.value === stopWord) {
				return {
					expression: {
						segments,
						span: { end: lastSpan.end, start: first.span.start },
						type: "path",
					},
					nextIndex,
				};
			}

			if (token.type === "dot") {
				const segment = this.#expectPathSegment(tokens, nextIndex + 1);
				segments.push(segment.value);
				lastSpan = segment.span;
				nextIndex += 2;
				continue;
			}

			throw new TemplateSyntaxError("Malformed path expression", {
				span: token.span,
			});
		}

		throw new TemplateSyntaxError("Unexpected end in expression", {
			span: lastSpan,
		});
	}

	#expectPathSegment(tokens: readonly Token[], index: number) {
		const token = this.#expectWord(tokens, index);

		if (this.#isExpressionLiteralWord(token.value)) {
			throw new TemplateSyntaxError("Unsupported literal expression", {
				span: token.span,
			});
		}

		return token;
	}

	#parseClosingDirective(
		tokens: readonly Token[],
		index: number,
		word: string,
		expectedName?: string,
	): ClosingDirectiveResult {
		const open = this.#expectToken(tokens, index, "openDirective");
		this.#expectWord(tokens, index + 1, word);
		let closeIndex = index + 2;

		if (expectedName !== undefined) {
			const maybeName = tokens[closeIndex];

			if (maybeName?.type === "word") {
				if (maybeName.value !== expectedName) {
					throw new TemplateSyntaxError(
						`Mismatched endblock name. Expected "${expectedName}", received "${maybeName.value}".`,
						{ span: maybeName.span },
					);
				}
				closeIndex++;
			}
		}

		const close = this.#expectToken(tokens, closeIndex, "closeDirective");

		return {
			nextIndex: closeIndex + 1,
			span: { end: close.span.end, start: open.span.start },
		};
	}

	#isStopDirective(
		tokens: readonly Token[],
		index: number,
		stopWords: readonly string[],
	) {
		const open = tokens[index];
		const word = tokens[index + 1];

		return (
			open?.type === "openDirective" &&
			word?.type === "word" &&
			stopWords.includes(word.value)
		);
	}

	#isClosingDirectiveWord(value: string) {
		return (
			value === "else" ||
			value === "endif" ||
			value === "endblock" ||
			value === "endapply" ||
			value === "endtemplate" ||
			value === "endfor"
		);
	}

	#isExpressionLiteralWord(value: string) {
		return (
			value === "true" ||
			value === "false" ||
			value === "null" ||
			value === "undefined" ||
			value === "NaN" ||
			value === "Infinity"
		);
	}

	#expectWord(tokens: readonly Token[], index: number, value?: string) {
		const token = tokens[index];

		if (!token || token.type !== "word") {
			if (value !== undefined) {
				throw new TemplateSyntaxError(`Expected ${value} directive`, {
					...(token === undefined ? {} : { span: token.span }),
				});
			}

			if (token) {
				throw new TemplateSyntaxError("Expected word token", {
					span: token.span,
				});
			}
			throw new TemplateSyntaxError("Expected word token");
		}

		if (value !== undefined && token.value !== value) {
			throw new TemplateSyntaxError(`Expected ${value} directive`, {
				span: token.span,
			});
		}

		return token;
	}

	#expectToken<T extends Token["type"]>(
		tokens: readonly Token[],
		index: number,
		type: T,
	): Extract<Token, { type: T }> {
		const token = tokens[index];

		if (!token || token.type !== type) {
			if (token) {
				throw new TemplateSyntaxError(`Expected ${type} token`, {
					span: token.span,
				});
			}
			throw new TemplateSyntaxError(`Expected ${type} token`);
		}

		return token as Extract<Token, { type: T }>;
	}
}
