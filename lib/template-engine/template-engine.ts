type Token = {
	type: "text" | "variable";
	value: string;
};

type ASTNode = {
	type: "text" | "variable";
	value: string;
};

export class ScreamTemplateEngine {
	compile(template: string, context: Record<string, unknown>) {
		const tokens = this.#tokenize(template); // Phase 1: Tokenizer
		const ast = this.#parse(tokens); // Phase 2: Parser
		const transformedAst = this.#transform(ast); // Phase 3: Transformer
		return this.#generate(transformedAst, context); // Phase 4: Generator
	}

	// Tokenizer: Converts template into tokens
	#tokenize(template: string) {
		const tokens: Token[] = [];
		let index = 0;

		while (index < template.length) {
			if (this.#isVariableStart(template, index)) {
				const { token, nextIndex } = this.#extractVariableToken(
					template,
					index,
				);
				tokens.push(token);
				index = nextIndex;
				continue;
			}

			const { token, nextIndex } = this.#extractTextToken(template, index);
			tokens.push(token);
			index = nextIndex;
		}

		return tokens;
	}

	// Helper for tokenization
	#isVariableStart(template: string, index: number) {
		return template[index] === "{" && template[index + 1] === "{";
	}

	#extractVariableToken(template: string, startIndex: number) {
		const endIndex = template.indexOf("}}", startIndex);
		if (endIndex === -1) {
			const token: Token = { type: "text", value: template.slice(startIndex) };

			return {
				token,
				nextIndex: template.length,
			};
		}

		const variable = template.slice(startIndex + 2, endIndex).trim();
		const token: Token = { type: "variable", value: variable || "" };

		return {
			token,
			nextIndex: endIndex + 2,
		};
	}

	#extractTextToken(template: string, startIndex: number) {
		const nextVariableIndex = template.indexOf("{{", startIndex);
		const endIndex =
			nextVariableIndex === -1 ? template.length : nextVariableIndex;

		const token: Token = {
			type: "text",
			value: template.slice(startIndex, endIndex),
		};

		return {
			token,
			nextIndex: endIndex,
		};
	}

	// Parser: Converts tokens into an abstract syntax tree (AST)
	#parse(tokens: Token[]) {
		return tokens.map((token) => ({
			type: token.type,
			value: token.value,
		}));
	}

	// Transformer: Modifies or optimizes the AST (currently a passthrough)
	#transform(ast: ASTNode[]) {
		// For now, we just return the same AST without modifications.
		return ast;
	}

	// Generator: Converts AST into the final output string
	#generate(ast: ASTNode[], context: Record<string, unknown>) {
		return ast
			.map((node) => {
				if (node.type === "text") {
					return node.value;
				}

				const variableValue = context[node.value];
				if (
					node.value === "" ||
					variableValue === undefined ||
					variableValue === null ||
					typeof variableValue === "object" ||
					typeof variableValue === "function"
				) {
					return "";
				}

				return this.#escape(String(variableValue));
			})
			.join("");
	}

	#escape(value: string) {
		if (/&(?:amp|lt|gt|quot|#39);/.test(value)) {
			return value;
		}

		return value
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}
}
