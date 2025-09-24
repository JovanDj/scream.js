import type { Token } from "./tokenizer.js";

export type ASTNode = {
	readonly type: "text" | "variable" | "if" | "for" | "extends" | "block";
	readonly value?: string;
	readonly path?: (string | number)[];
	readonly children?: readonly ASTNode[];
	readonly alternate?: readonly ASTNode[];
	readonly iterator?: string;
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
		return this.#parseTemplate(tokens, 0).ast;
	}

	#parseTemplate(tokens: readonly Token[], index: number): ParseResult {
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
		const { ast: restNodes, nextIndex: finalIndex } = this.#parseTemplate(
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
				return this.#parseText(index, token);

			case "variable":
				return this.#parseVariable(index, tokens);

			case "block":
				return this.#parseBlock(tokens, index);

			case "if":
				return this.#parseIf(tokens, index);

			case "for":
				return this.#parseFor(tokens, index);

			case "extends":
				return this.#parseExtends(index, token);

			default:
				throw new Error(`Unexpected token: ${token.type}`);
		}
	}

	#parseExtends(
		index: number,
		token: { type: "extends"; template: string },
	): NodeResult {
		return {
			nextIndex: index + 1,
			node: { type: "extends", value: token.template },
		};
	}

	#parseVariable(index: number, tokens: readonly Token[]): NodeResult {
		const { path, nextIndex } = this.#parsePath(tokens, index + 1, []);
		return { nextIndex, node: { path, type: "variable" } };
	}

	#parsePath(
		tokens: readonly Token[],
		index: number,
		acc: (string | number)[],
	): { path: (string | number)[]; nextIndex: number } {
		if (index >= tokens.length) {
			return { nextIndex: index, path: acc };
		}

		const token = tokens[index];
		if (!token) {
			throw new Error("Unknown token");
		}

		switch (token.type) {
			case "identifier":
				return this.#parsePath(tokens, index + 1, [...acc, token.name]);

			case "number":
				return this.#parsePath(tokens, index + 1, [...acc, token.value]);

			case "string":
				return this.#parsePath(tokens, index + 1, [...acc, token.value]);

			case "dot":
				return this.#parsePath(tokens, index + 1, acc);

			default:
				return { nextIndex: index, path: acc };
		}
	}

	#parseText(
		index: number,
		token: { type: "text"; value: string },
	): NodeResult {
		return {
			nextIndex: index + 1,
			node: { type: "text", value: token.value },
		};
	}

	#parseBlock(tokens: readonly Token[], index: number): NodeResult {
		const startToken = tokens[index];
		if (!startToken || startToken.type !== "block") {
			throw new Error("Missing start token for block");
		}
		const { ast: children, nextIndex } = this.#parseTemplate(tokens, index + 1);
		return {
			nextIndex: nextIndex + 1,
			node: { children, type: "block", value: startToken.name },
		};
	}

	#parseIf(tokens: readonly Token[], index: number): NodeResult {
		const start = tokens[index];

		if (!start || start.type !== "if") {
			throw new Error("Invalid if token");
		}

		const thenRes = this.#parseTemplateUntil(tokens, index + 1, [
			"else",
			"endif",
		]);
		const next = tokens[thenRes.nextIndex];

		if (next?.type === "else") {
			const elseRes = this.#parseTemplateUntil(tokens, thenRes.nextIndex + 1, [
				"endif",
			]);
			if (tokens[elseRes.nextIndex]?.type !== "endif") {
				throw new Error(`Missing endif for if starting at ${index}`);
			}
			return {
				nextIndex: elseRes.nextIndex + 1,
				node: {
					alternate: elseRes.ast,
					children: thenRes.ast,
					type: "if",
					value: start.condition,
				},
			};
		}

		if (next?.type !== "endif") {
			throw new Error(`Missing endif for if starting at ${index}`);
		}

		return {
			nextIndex: thenRes.nextIndex + 1,
			node: { children: thenRes.ast, type: "if", value: start.condition },
		};
	}

	#loopStack: string[] = [];

	#parseFor(tokens: readonly Token[], index: number): NodeResult {
		const startToken = tokens[index];
		if (!startToken || startToken.type !== "for") {
			throw new Error("Invalid for token");
		}

		this.#loopStack.push(startToken.iterator);
		const { ast: children, nextIndex } = this.#parseTemplate(tokens, index + 1);
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

	#parseTemplateUntil(
		tokens: readonly Token[],
		index: number,
		endTypes: string[],
	): ParseResult {
		if (index >= tokens.length) {
			throw new Error("Unexpected end inside block");
		}

		const token = tokens[index];

		if (!token) {
			throw new Error("Unknown token");
		}

		if (endTypes.includes(token.type)) {
			return { ast: [], nextIndex: index };
		}

		const { node, nextIndex } = this.#parseNextNode(tokens, index);
		const { ast: rest, nextIndex: finalIndex } = this.#parseTemplateUntil(
			tokens,
			nextIndex,
			endTypes,
		);

		return { ast: [node, ...rest], nextIndex: finalIndex };
	}
}
