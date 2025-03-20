import type { Token } from "./tokenizer.js";

export type ASTNode = {
	readonly type: "text" | "variable" | "if" | "for" | "extends" | "block";
	readonly value?: string;
	readonly children?: readonly ASTNode[];
	readonly alternate?: readonly ASTNode[];
	readonly iterator?: string;
	readonly path?: (string | number)[];
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

		if (token?.type === "endif" || token?.type === "else") {
			throw new Error(`Unexpected token: ${token.type}`);
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
			case "text":
				return {
					nextIndex: index + 1,
					node: { type: "text", value: token.value },
				};

			case "variable": {
				const path: (string | number)[] = [];
				let i = index + 1;

				while (i < tokens.length) {
					const t = tokens[i];
					if (!t) {
						break;
					}

					if (t.type === "identifier") {
						path.push(t.name);
					} else if (t.type === "number") {
						path.push(t.value);
					} else if (t.type === "string") {
						path.push(t.value);
					} else if (t.type === "dot") {
						// skip
					} else {
						break; // end of variable expression
					}
					i++;
				}

				// fallback 1: variable token might have a name
				if (
					path.length === 0 &&
					"name" in token &&
					typeof token.name === "string"
				) {
					path.push(...this.#parsePath(token.name));
				}

				// fallback 2: inside a for-loop, use iterator
				if (path.length === 0 && this.#loopStack.length > 0) {
					const iterator = this.#loopStack[this.#loopStack.length - 1];
					if (iterator) {
						path.push(iterator);
					}
				}

				return {
					nextIndex: i,
					node: { path, type: "variable" },
				};
			}

			case "block":
				return this.#parseBlock(tokens, index);

			case "if":
				return this.#parseIf(tokens, index);

			case "for":
				return this.#parseFor(tokens, index);

			case "extends":
				return {
					nextIndex: index + 1,
					node: { type: "extends", value: token.template },
				};

			default:
				throw new Error(`Unexpected token: ${token.type}`);
		}
	}

	#parseBlock(tokens: readonly Token[], index: number): NodeResult {
		const startToken = tokens[index];
		if (!startToken || startToken.type !== "block") {
			throw new Error("Missing start token for block");
		}
		const { ast: children, nextIndex } = this.#parseTopLevel(tokens, index + 1);
		return {
			nextIndex: nextIndex + 1,
			node: { children, type: "block", value: startToken.name },
		};
	}

	#parseIf(tokens: readonly Token[], index: number): NodeResult {
		const startToken = tokens[index];
		if (!startToken || startToken.type !== "if") {
			throw new Error("Invalid if token");
		}

		const { ast: ifChildren, nextIndex: afterIf } = this.#parseUntil(
			tokens,
			index + 1,
			["else", "endif"],
		);

		const elseToken = tokens[afterIf];
		if (elseToken?.type === "else") {
			const { ast: elseChildren, nextIndex: afterElse } = this.#parseUntil(
				tokens,
				afterIf + 1,
				["endif"],
			);
			return {
				nextIndex: afterElse + 1,
				node: {
					alternate: elseChildren,
					children: ifChildren,
					type: "if",
					value: startToken.condition,
				},
			};
		}

		return {
			nextIndex: afterIf + 1,
			node: {
				children: ifChildren,
				type: "if",
				value: startToken.condition,
			},
		};
	}

	#loopStack: string[] = [];

	#parseFor(tokens: readonly Token[], index: number): NodeResult {
		const startToken = tokens[index];
		if (!startToken || startToken.type !== "for") {
			throw new Error("Invalid for token");
		}

		this.#loopStack.push(startToken.iterator);
		const { ast: children, nextIndex } = this.#parseTopLevel(tokens, index + 1);
		this.#loopStack.pop();

		return {
			nextIndex: nextIndex + 1,
			node: {
				children,
				iterator: startToken.iterator,
				type: "for",
				value: startToken.collection,
			},
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
				throw new Error("Unexpected undefined token during walk"); // ✅ guard added back
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
