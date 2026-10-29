import type { TemplateASTNode } from "./ast.js";
import type {
	ExpressionNode,
	PathExpressionNode,
	PathSegment,
} from "./expression.js";
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
		stopDirectives: readonly string[],
	): ParseResult {
		const ast: TemplateASTNode[] = [];
		let nextIndex = index;

		while (nextIndex < tokens.length) {
			if (this.#isStopDirective(tokens, nextIndex, stopDirectives)) {
				return { ast, nextIndex };
			}

			const result = this.#parseNode(tokens, nextIndex);
			ast.push(result.node);
			nextIndex = result.nextIndex;
		}

		if (stopDirectives.length > 0) {
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
		const directive = this.#expectToken(tokens, index + 1, "identifier");

		if (directive.value === "extends") {
			return this.#parseExtends(tokens, index);
		}

		if (directive.value === "block") {
			return this.#parseBlock(tokens, index);
		}

		if (directive.value === "if") {
			return this.#parseIf(tokens, index);
		}

		if (directive.value === "for") {
			return this.#parseFor(tokens, index);
		}

		if (directive.value === "attr") {
			return this.#parseAttr(tokens, index);
		}

		if (
			["endblock", "else", "endif", "in", "endfor"].includes(directive.value)
		) {
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
		this.#expectDirectiveWord(tokens, index + 1, "extends");
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
		this.#expectDirectiveWord(tokens, index + 1, "block");
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
		this.#expectDirectiveWord(tokens, index + 1, "if");
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
		this.#expectDirectiveWord(tokens, index + 1, "for");
		const iterator = this.#expectToken(tokens, index + 2, "identifier");
		this.#expectDirectiveWord(tokens, index + 3, "in");
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
		this.#expectDirectiveWord(tokens, index + 1, "attr");
		let closeIndex = index + 2;

		while (tokens[closeIndex]?.type !== "closeDirective") {
			if (tokens[closeIndex] === undefined) {
				throw new TemplateSyntaxError("Expected closeDirective token", {
					span: open.span,
				});
			}

			closeIndex++;
		}

		const close = this.#expectToken(tokens, closeIndex, "closeDirective");
		const span = { end: close.span.end, start: open.span.start };
		const separator = this.#findAttrSeparator(tokens, index + 2, closeIndex);
		let nameEnd = index + 2;

		while (nameEnd < separator && tokens[nameEnd]?.type !== "equals") {
			nameEnd++;
		}

		const name = this.#parseAttrName(tokens.slice(index + 2, nameEnd), span);
		const condition = this.#parseExpressionRange(
			tokens.slice(separator + 1, closeIndex),
			close.span,
		);

		if (nameEnd === separator) {
			return {
				nextIndex: closeIndex + 1,
				node: { condition, name, span, type: "attr" },
			};
		}

		if (nameEnd + 1 === separator) {
			throw new TemplateSyntaxError(
				'Invalid attr directive: expected attribute value expression after "=".',
				{ span: tokens[nameEnd]?.span ?? span },
			);
		}

		const value = this.#parseExpressionRange(
			tokens.slice(nameEnd + 1, separator),
			span,
		);

		return {
			nextIndex: closeIndex + 1,
			node: { condition, name, span, type: "attr", value },
		};
	}

	#findAttrSeparator(
		tokens: readonly Token[],
		start: number,
		end: number,
	): number {
		let separator = -1;
		let bracketDepth = 0;

		for (let index = start; index < end; index++) {
			const token = tokens[index];
			const previous = tokens[index - 1];
			const next = tokens[index + 1];

			if (token?.type === "leftBracket") {
				bracketDepth++;
				continue;
			}

			if (token?.type === "rightBracket") {
				bracketDepth--;
				continue;
			}

			if (
				bracketDepth !== 0 ||
				token?.type !== "identifier" ||
				token.value !== "if" ||
				previous === undefined ||
				next === undefined ||
				index + 1 >= end ||
				previous.type === "dot" ||
				next.type === "dot" ||
				previous.span.end === token.span.start ||
				token.span.end === next.span.start
			) {
				continue;
			}

			separator = index;
		}

		if (separator === -1) {
			const token = tokens[start] ?? tokens[end];

			throw new TemplateSyntaxError(
				'Invalid attr directive: expected "if" condition.',
				token === undefined ? {} : { span: token.span },
			);
		}

		return separator;
	}

	#parseAttrName(tokens: readonly Token[], span: SourceSpan): string {
		if (tokens.length === 0) {
			throw new TemplateSyntaxError(
				'Invalid attr directive: expected attribute name after "attr".',
				{ span },
			);
		}

		let name = "";
		let previousEnd = tokens[0]?.span.start;

		for (const token of tokens) {
			if (token.span.start !== previousEnd) {
				throw new TemplateSyntaxError(
					"Invalid attr directive: invalid attribute name.",
					{
						span: token.span,
					},
				);
			}

			if (token.type === "dot") {
				throw new TemplateSyntaxError(
					"Invalid attr directive: dynamic attribute names are not supported.",
					{ span: token.span },
				);
			}

			if (token.type === "identifier" || token.type === "number") {
				name += token.value;
				previousEnd = token.span.end;
				continue;
			}

			if (token.type === "dash" || token.type === "colon") {
				name += token.type === "dash" ? "-" : ":";
				previousEnd = token.span.end;
				continue;
			}

			throw new TemplateSyntaxError(
				"Invalid attr directive: invalid attribute name.",
				{
					span: token.span,
				},
			);
		}

		if (!/^[A-Za-z_:][A-Za-z0-9_:-]*$/.test(name)) {
			throw new TemplateSyntaxError(
				`Invalid attr directive: invalid attribute name "${name}".`,
				{ span },
			);
		}

		return name;
	}

	#parseExpressionRange(
		tokens: readonly Token[],
		span: SourceSpan,
	): ExpressionNode {
		const first = tokens[0];

		if (first === undefined) {
			throw new TemplateSyntaxError("Empty expression", { span });
		}

		if (tokens.length !== 1) {
			return this.#parsePathTokens(tokens);
		}

		if (first.type === "string") {
			return { span: first.span, type: "literal", value: first.value };
		}

		if (first.type === "number") {
			return {
				span: first.span,
				type: "literal",
				value: this.#parseNumber(first),
			};
		}

		if (first.type === "identifier" && first.value === "true") {
			return { span: first.span, type: "literal", value: true };
		}

		if (first.type === "identifier" && first.value === "false") {
			return { span: first.span, type: "literal", value: false };
		}

		return this.#parsePathTokens(tokens);
	}

	#parseNumber(token: Extract<Token, { type: "number" }>): number {
		const value = Number(token.value);

		if (!Number.isSafeInteger(value)) {
			throw new TemplateSyntaxError(
				"Numeric literal exceeds safe integer range",
				{
					span: token.span,
				},
			);
		}

		return value;
	}

	#parsePathExpression(
		tokens: readonly Token[],
		index: number,
		stopTokenType: "closeVariable" | "closeDirective",
	): { expression: ExpressionNode; nextIndex: number } {
		const first = tokens[index];

		if (first?.type === stopTokenType) {
			throw new TemplateSyntaxError("Empty expression", { span: first.span });
		}

		let nextIndex = index;

		while (tokens[nextIndex]?.type !== stopTokenType) {
			if (tokens[nextIndex] === undefined) {
				throw new TemplateSyntaxError("Unexpected end in expression", {
					...(first === undefined ? {} : { span: first.span }),
				});
			}

			nextIndex++;
		}

		return {
			expression: this.#parsePathTokens(tokens.slice(index, nextIndex)),
			nextIndex,
		};
	}

	#parsePathTokens(tokens: readonly Token[]): PathExpressionNode {
		const first = this.#expectToken(tokens, 0, "identifier");
		const segments: PathSegment[] = [first.value];
		let lastSpan = first.span;
		let nextIndex = 1;

		while (nextIndex < tokens.length) {
			const token = tokens[nextIndex];

			if (token?.type === "dot") {
				const segment = this.#expectToken(tokens, nextIndex + 1, "identifier");
				segments.push(segment.value);
				lastSpan = segment.span;
				nextIndex += 2;
				continue;
			}

			if (token?.type === "leftBracket") {
				const segment = tokens[nextIndex + 1];

				if (
					segment === undefined ||
					(segment.type !== "string" && segment.type !== "number")
				) {
					throw new TemplateSyntaxError("Malformed path expression", {
						span: token.span,
					});
				}

				const close = this.#expectToken(tokens, nextIndex + 2, "rightBracket");
				segments.push(
					segment.type === "number"
						? this.#parseNumber(segment)
						: segment.value,
				);
				lastSpan = close.span;
				nextIndex += 3;
				continue;
			}

			throw new TemplateSyntaxError("Malformed path expression", {
				span: token?.span ?? lastSpan,
			});
		}

		return {
			segments,
			span: { end: lastSpan.end, start: first.span.start },
			type: "path",
		};
	}

	#parseClosingDirective(
		tokens: readonly Token[],
		index: number,
		directive: string,
		expectedName?: string,
	): { nextIndex: number; span: { start: number; end: number } } {
		const open = this.#expectToken(tokens, index, "openDirective");
		this.#expectDirectiveWord(tokens, index + 1, directive);
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
		stopDirectives: readonly string[],
	) {
		const open = tokens[index];
		const directive = tokens[index + 1];

		return (
			open?.type === "openDirective" &&
			directive?.type === "identifier" &&
			stopDirectives.includes(directive.value)
		);
	}

	#expectDirectiveWord(tokens: readonly Token[], index: number, value: string) {
		const token = this.#expectToken(tokens, index, "identifier");

		if (token.value !== value) {
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
