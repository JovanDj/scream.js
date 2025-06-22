import type { Token } from "./tokenizer.js";

export type ASTNode = {
	readonly type:
		| "text"
		| "variable"
		| "if"
		| "else"
		| "for"
		| "endfor"
		| "extends"
		| "block"
		| "endblock";
	readonly value: string;
	readonly children?: readonly ASTNode[];
	readonly alternate?: readonly ASTNode[];
	readonly iterator?: string;
	readonly path?: (string | number)[] | undefined;
};

type ParseResult = {
	readonly ast: readonly ASTNode[];
	readonly nextIndex: number;
};

type NodeResult = {
	readonly node: ASTNode;
	readonly nextIndex: number;
};

export class Parser {
	parse(tokens: readonly Token[]) {
		return this.#parseTopLevel(tokens, 0).ast;
	}

	#parseTopLevel(tokens: readonly Token[], index: number): ParseResult {
		if (index >= tokens.length) {
			return { ast: [], nextIndex: index };
		}

		const token = tokens[index];
		if (token?.type === "endfor" || token?.type === "endblock") {
			return { ast: [], nextIndex: index };
		}

		const { node, nextIndex } = this.#parseNextNode(tokens, index);
		const { ast: restNodes, nextIndex: finalIndex } = this.#parseTopLevel(
			tokens,
			nextIndex,
		);

		return { ast: [node, ...restNodes], nextIndex: finalIndex };
	}

	#parseNextNode(tokens: readonly Token[], index: number): NodeResult {
		const token = tokens[index];
		if (!token) {
			throw new Error("Unexpected end of input");
		}

		switch (token.type) {
			case "text": {
				return {
					node: {
						type: token.type,
						value: token.value,
					},
					nextIndex: index + 1,
				};
			}
			case "variable": {
				return {
					node: {
						type: token.type,
						value: token.value,
						path: this.#parsePath(token.value),
					},
					nextIndex: index + 1,
				};
			}

			case "extends":
				return {
					node: {
						type: "extends",
						value: token.value,
					},
					nextIndex: index + 1,
				};

			case "block":
				return this.#parseBlock(tokens, index);

			case "if":
				return this.#parseIf(tokens, index);

			case "for":
				return this.#parseFor(tokens, index);

			default:
				throw new Error(`Unexpected token: ${token.type}`);
		}
	}

	#parseBlock(tokens: readonly Token[], index: number): NodeResult {
		const startToken = tokens[index];
		if (!startToken) {
			throw new Error("Missing start token for block");
		}
		const { ast: children, nextIndex } = this.#parseTopLevel(tokens, index + 1);
		return {
			node: { type: "block", value: startToken.value, children },
			nextIndex: nextIndex + 1,
		};
	}

	#parseIf(tokens: readonly Token[], index: number): NodeResult {
		const startToken = tokens[index];
		if (!startToken) {
			throw new Error("Missing start token for if");
		}
		const { ast: ifChildren, nextIndex: afterIf } = this.#parseUntil(
			tokens,
			index + 1,
			["else", "endif"],
		);
		const nextToken = tokens[afterIf];
		if (!nextToken) {
			throw new Error("Unexpected end of input after if block");
		}

		if (nextToken.type === "else") {
			const { ast: elseChildren, nextIndex: afterElse } = this.#parseUntil(
				tokens,
				afterIf + 1,
				["endif"],
			);

			const endifCheck = tokens[afterElse];
			if (!endifCheck || endifCheck.type !== "endif") {
				throw new Error("Expected {% endif %} after {% else %}");
			}

			return {
				node: {
					type: "if",
					value: startToken.value,
					children: ifChildren,
					alternate: elseChildren,
				},
				nextIndex: afterElse + 1,
			};
		}

		if (nextToken.type === "endif") {
			return {
				node: {
					type: "if",
					value: startToken.value,
					children: ifChildren,
				},
				nextIndex: afterIf + 1,
			};
		}

		throw new Error("Expected endif or else after if block");
	}

	#parseFor(tokens: readonly Token[], index: number): NodeResult {
		const startToken = tokens[index];
		if (
			!startToken ||
			startToken.type !== "for" ||
			typeof startToken.iterator !== "string"
		) {
			throw new Error("Invalid for token");
		}

		const { ast: children, nextIndex } = this.#parseTopLevel(tokens, index + 1);
		return {
			node: {
				type: "for",
				value: startToken.value,
				iterator: startToken.iterator,
				children,
			},
			nextIndex: nextIndex + 1,
		};
	}

	#parseUntil(
		tokens: readonly Token[],
		index: number,
		endTypes: ReadonlyArray<string>,
	): ParseResult {
		const walk = (idx: number, acc: readonly ASTNode[]): ParseResult => {
			if (idx >= tokens.length) {
				throw new Error("Unexpected end of input inside block");
			}

			const currentToken = tokens[idx];
			if (!currentToken) {
				throw new Error("Unexpected undefined token during walk");
			}

			if (endTypes.includes(currentToken.type)) {
				return { ast: acc, nextIndex: idx };
			}

			const { node, nextIndex } = this.#parseNextNode(tokens, idx);
			return walk(nextIndex, [...acc, node]);
		};

		return walk(index, []);
	}

	#parsePath(path: string) {
		return Array.from(
			path.matchAll(/([a-zA-Z0-9_]+)|\[(\d+)\]/g),
			(match) => match[1] ?? Number(match[2]),
		);
	}
}
