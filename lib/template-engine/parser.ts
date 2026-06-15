import type { TemplateASTNode } from "./ast.js";
import type { ExpressionNode, PathSegment } from "./expression.js";
import {
	type SourceSpan,
	TemplateSyntaxError,
} from "./template-syntax-error.js";
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
			return this.#parseDirective(tokens, index);
		}

		throw new TemplateSyntaxError(`Unexpected token: ${token.type}`, {
			span: token.span,
		});
	}

	#parseDirective(tokens: readonly Token[], index: number): NodeResult {
		const firstDirectiveToken = tokens[index + 1];

		if (firstDirectiveToken?.type === "identifier") {
			throw new TemplateSyntaxError("Unknown directive", {
				span: firstDirectiveToken.span,
			});
		}

		const keyword = this.#expectKeyword(tokens, index + 1);

		if (keyword.value === "extends") {
			return this.#parseExtends(tokens, index);
		}

		if (keyword.value === "block") {
			return this.#parseBlock(tokens, index);
		}

		if (keyword.value === "if") {
			return this.#parseIf(tokens, index);
		}

		if (keyword.value === "for") {
			return this.#parseFor(tokens, index);
		}

		if (keyword.value === "attr") {
			return this.#parseAttr(tokens, index);
		}

		throw new TemplateSyntaxError(`Unexpected directive: ${keyword.value}`, {
			span: keyword.span,
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

	#parseAttr(tokens: readonly Token[], index: number): NodeResult {
		const open = this.#expectToken(tokens, index, "openDirective");
		this.#expectKeyword(tokens, index + 1, "attr");
		const directive = this.#expectToken(tokens, index + 2, "attrDirective");
		const close = this.#expectToken(tokens, index + 3, "closeDirective");
		const parsedDirective = this.#parseAttrDirective(
			directive.value,
			directive.span,
		);
		const span = { end: close.span.end, start: open.span.start };

		return {
			nextIndex: index + 4,
			node:
				parsedDirective.value === undefined
					? {
							condition: parsedDirective.condition,
							name: parsedDirective.name,
							span,
							type: "attr",
						}
					: {
							condition: parsedDirective.condition,
							name: parsedDirective.name,
							span,
							type: "attr",
							value: parsedDirective.value,
						},
		};
	}

	#parseAttrDirective(
		rawDirective: string,
		span: SourceSpan,
	): {
		readonly name: string;
		readonly condition: ExpressionNode;
		readonly value?: ExpressionNode;
	} {
		const directive = rawDirective.trim();

		if (directive.startsWith("if ")) {
			throw new TemplateSyntaxError(
				'Invalid attr directive: expected attribute name after "attr".',
				{ span },
			);
		}

		const match = directive.match(/^(.*)\s+if\s+(.+)$/);

		if (!match) {
			throw new TemplateSyntaxError(
				'Invalid attr directive: expected "if" condition.',
				{ span },
			);
		}

		const beforeCondition = String(match[1]).trim();
		const conditionExpression = String(match[2]).trim();
		const equalsIndex = beforeCondition.indexOf("=");
		const rawNameEnd =
			equalsIndex === -1 ? beforeCondition.length : equalsIndex;
		const rawName = beforeCondition.slice(0, rawNameEnd).trim();

		if (!rawName) {
			throw new TemplateSyntaxError(
				'Invalid attr directive: expected attribute name after "attr".',
				{ span },
			);
		}

		if (rawName.includes(".")) {
			throw new TemplateSyntaxError(
				"Invalid attr directive: dynamic attribute names are not supported.",
				{ span },
			);
		}

		if (!/^[A-Za-z_:][A-Za-z0-9_.:-]*$/.test(rawName)) {
			throw new TemplateSyntaxError(
				`Invalid attr directive: invalid attribute name "${rawName}".`,
				{ span },
			);
		}

		const condition = this.#parseRawExpression(conditionExpression, span);

		if (equalsIndex === -1) {
			return { condition, name: rawName };
		}

		const attributeValueExpression = beforeCondition
			.slice(equalsIndex + 1)
			.trim();

		if (!attributeValueExpression) {
			throw new TemplateSyntaxError(
				'Invalid attr directive: expected attribute value expression after "=".',
				{ span },
			);
		}

		return {
			condition,
			name: rawName,
			value: this.#parseRawExpression(attributeValueExpression, span),
		};
	}

	#parseRawExpression(rawExpression: string, span: SourceSpan): ExpressionNode {
		const expression = rawExpression.trim();

		if (!expression) {
			throw new TemplateSyntaxError("Empty expression", { span });
		}

		const expressionStartInRaw = rawExpression.indexOf(expression);
		const expressionSpan = {
			end: span.start + expressionStartInRaw + expression.length,
			start: span.start + expressionStartInRaw,
		};

		if (expression.startsWith('"') || expression.startsWith("'")) {
			const quote = expression[0] ?? "";

			if (expression.length < 2 || !expression.endsWith(quote)) {
				throw new TemplateSyntaxError("Unclosed string literal", {
					span: expressionSpan,
				});
			}

			return {
				span: expressionSpan,
				type: "literal",
				value: expression.slice(1, -1),
			};
		}

		if (expression === "true") {
			return { span: expressionSpan, type: "literal", value: true };
		}

		if (expression === "false") {
			return { span: expressionSpan, type: "literal", value: false };
		}

		if (/^\d+$/.test(expression)) {
			return {
				span: expressionSpan,
				type: "literal",
				value: Number(expression),
			};
		}

		return {
			segments: this.#parseRawPathSegments(expression, expressionSpan),
			span: expressionSpan,
			type: "path",
		};
	}

	#parseRawPathSegments(
		expression: string,
		span: SourceSpan,
	): readonly PathSegment[] {
		const segments: PathSegment[] = [];
		let index = 0;

		const parseIdentifier = () => {
			const start = index;

			if (!/[A-Za-z_]/.test(expression[index] ?? "")) {
				throw new TemplateSyntaxError("Malformed path expression", {
					span: { end: span.start + index + 1, start: span.start + index },
				});
			}

			while (
				index < expression.length &&
				/[A-Za-z0-9_]/.test(expression[index] ?? "")
			) {
				index++;
			}

			return expression.slice(start, index);
		};

		segments.push(parseIdentifier());

		while (index < expression.length) {
			const char = expression[index];

			if (char === ".") {
				index++;
				segments.push(parseIdentifier());
				continue;
			}

			if (char === "[") {
				index++;
				const bracketValue = this.#parseRawBracketSegment(
					expression,
					span,
					index,
				);
				segments.push(bracketValue.segment);
				index = bracketValue.nextIndex;
				continue;
			}

			throw new TemplateSyntaxError("Malformed path expression", {
				span: { end: span.start + index + 1, start: span.start + index },
			});
		}

		return segments;
	}

	#parseRawBracketSegment(
		expression: string,
		span: SourceSpan,
		index: number,
	): { readonly segment: PathSegment; readonly nextIndex: number } {
		const char = expression[index];

		if (char === '"' || char === "'") {
			const quote = char;
			const valueStart = index + 1;
			let nextIndex = valueStart;

			while (nextIndex < expression.length && expression[nextIndex] !== quote) {
				nextIndex++;
			}

			if (expression[nextIndex] !== quote) {
				throw new TemplateSyntaxError("Unclosed string literal", {
					span: { end: span.end, start: span.start + index },
				});
			}

			if (expression[nextIndex + 1] !== "]") {
				throw new TemplateSyntaxError("Malformed path expression", {
					span: { end: span.start + nextIndex + 2, start: span.start + index },
				});
			}

			return {
				nextIndex: nextIndex + 2,
				segment: expression.slice(valueStart, nextIndex),
			};
		}

		if (/[0-9]/.test(char ?? "")) {
			const valueStart = index;
			let nextIndex = index;

			while (
				nextIndex < expression.length &&
				/[0-9]/.test(expression[nextIndex] ?? "")
			) {
				nextIndex++;
			}

			if (expression[nextIndex] !== "]") {
				throw new TemplateSyntaxError("Malformed path expression", {
					span: { end: span.start + nextIndex + 1, start: span.start + index },
				});
			}

			return {
				nextIndex: nextIndex + 1,
				segment: Number(expression.slice(valueStart, nextIndex)),
			};
		}

		throw new TemplateSyntaxError("Malformed path expression", {
			span: { end: span.start + index + 1, start: span.start + index },
		});
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
