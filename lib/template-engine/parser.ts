import type { TemplateASTNode } from "./ast.js";
import type { ExpressionNode, PathSegment } from "./expression.js";
import { TemplateSyntaxError } from "./template-syntax-error.js";
import type { Keyword, Token } from "./tokenizer.js";

type ParseResult = {
	readonly ast: readonly TemplateASTNode[];
	readonly nextIndex: number;
};

type NodeResult = {
	readonly node: TemplateASTNode;
	readonly nextIndex: number;
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
		stopKeywords: readonly Keyword[],
	): ParseResult {
		const ast: TemplateASTNode[] = [];
		let nextIndex = index;

		while (nextIndex < tokens.length) {
			if (this.#isStopDirective(tokens, nextIndex, stopKeywords)) {
				return { ast, nextIndex };
			}

			const result = this.#parseNode(tokens, nextIndex);
			ast.push(result.node);
			nextIndex = result.nextIndex;
		}

		if (stopKeywords.length > 0) {
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
			const firstDirectiveToken = tokens[index + 1];
			if (firstDirectiveToken?.type === "identifier") {
				throw new TemplateSyntaxError("Unknown directive", {
					span: firstDirectiveToken.span,
				});
			}

			const keyword = this.#expectKeyword(tokens, index + 1);

			switch (keyword.value) {
				case "extends":
					return this.#parseExtends(tokens, index);

				case "block":
					return this.#parseBlock(tokens, index);

				case "if":
					return this.#parseIf(tokens, index);

				case "for":
					return this.#parseFor(tokens, index);

				default:
					throw new TemplateSyntaxError(
						`Unexpected directive: ${keyword.value}`,
						{ span: keyword.span },
					);
			}
		}

		throw new TemplateSyntaxError(`Unexpected token: ${token.type}`, {
			span: token.span,
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
		this.#expectKeyword(tokens, index + 1, "extends");
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
		this.#expectKeyword(tokens, index + 1, "block");
		const name = this.#expectToken(tokens, index + 2, "identifier");
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
		this.#expectKeyword(tokens, index + 1, "if");
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

	#parseFor(tokens: readonly Token[], index: number): NodeResult {
		const open = this.#expectToken(tokens, index, "openDirective");
		this.#expectKeyword(tokens, index + 1, "for");
		const iterator = this.#expectToken(tokens, index + 2, "identifier");
		this.#expectKeyword(tokens, index + 3, "in");
		const collection = this.#parsePathExpression(
			tokens,
			index + 4,
			"closeDirective",
		);
		this.#expectToken(tokens, collection.nextIndex, "closeDirective");

		const children = this.#parseTemplate(tokens, collection.nextIndex + 1, [
			"endfor",
		]);
		const close = this.#parseClosingDirective(
			tokens,
			children.nextIndex,
			"endfor",
		);

		return {
			nextIndex: close.nextIndex,
			node: {
				children: children.ast,
				collection: collection.expression,
				iterator: iterator.value,
				span: { end: close.span.end, start: open.span.start },
				type: "for",
			},
		};
	}

	#parsePathExpression(
		tokens: readonly Token[],
		index: number,
		stopTokenType: "closeVariable" | "closeDirective",
	): { expression: ExpressionNode; nextIndex: number } {
		const maybeStop = tokens[index];
		if (maybeStop?.type === stopTokenType) {
			throw new TemplateSyntaxError("Empty expression", {
				span: maybeStop.span,
			});
		}

		const first = this.#expectToken(tokens, index, "identifier");
		const segments: PathSegment[] = [first.value];
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

			if (token.type === "dot") {
				const segment = this.#expectPathPropertyToken(tokens, nextIndex + 1);
				segments.push(segment.value);
				lastSpan = segment.span;
				nextIndex += 2;
				continue;
			}

			if (token.type === "leftBracket") {
				const segment = tokens[nextIndex + 1];

				if (
					!segment ||
					(segment.type !== "string" && segment.type !== "number")
				) {
					throw new TemplateSyntaxError("Malformed path expression", {
						span: token.span,
					});
				}

				const close = this.#expectToken(tokens, nextIndex + 2, "rightBracket");
				segments.push(segment.value);
				lastSpan = close.span;
				nextIndex += 3;
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

	#parseClosingDirective(
		tokens: readonly Token[],
		index: number,
		keyword: Keyword,
		expectedName?: string,
	): { nextIndex: number; span: { start: number; end: number } } {
		const open = this.#expectToken(tokens, index, "openDirective");
		this.#expectKeyword(tokens, index + 1, keyword);
		let closeIndex = index + 2;

		if (expectedName !== undefined) {
			const maybeName = tokens[closeIndex];

			if (maybeName?.type === "identifier") {
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
		stopKeywords: readonly Keyword[],
	) {
		const open = tokens[index];
		const keyword = tokens[index + 1];

		return (
			open?.type === "openDirective" &&
			keyword?.type === "keyword" &&
			stopKeywords.includes(keyword.value)
		);
	}

	#expectKeyword(tokens: readonly Token[], index: number, value?: Keyword) {
		const token = tokens[index];

		if (!token || token.type !== "keyword") {
			if (value !== undefined) {
				throw new TemplateSyntaxError(`Expected ${value} directive`, {
					...(token === undefined ? {} : { span: token.span }),
				});
			}

			if (token) {
				throw new TemplateSyntaxError("Expected keyword token", {
					span: token.span,
				});
			}
			throw new TemplateSyntaxError("Expected keyword token");
		}

		if (value !== undefined && token.value !== value) {
			throw new TemplateSyntaxError(`Expected ${value} directive`, {
				span: token.span,
			});
		}

		return token;
	}

	#expectPathPropertyToken(tokens: readonly Token[], index: number) {
		const token = tokens[index];

		if (!token || (token.type !== "identifier" && token.type !== "keyword")) {
			if (token) {
				throw new TemplateSyntaxError("Expected identifier token", {
					span: token.span,
				});
			}
			throw new TemplateSyntaxError("Expected identifier token");
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
