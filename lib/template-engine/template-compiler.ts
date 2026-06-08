import type { TemplateASTNode } from "./ast.js";
import type { Parser } from "./parser.js";
import type { Tokenizer } from "./tokenizer.js";
import type { Transformer } from "./transformer.js";

export class TemplateCompiler {
	readonly #tokenizer: Tokenizer;
	readonly #parser: Parser;
	readonly #transformer: Transformer;

	constructor(tokenizer: Tokenizer, parser: Parser, transformer: Transformer) {
		this.#tokenizer = tokenizer;
		this.#parser = parser;
		this.#transformer = transformer;
	}

	compile(template: string): readonly TemplateASTNode[] {
		const tokens = this.#tokenizer.tokenize(template);
		const ast = this.#parser.parse(tokens);

		return this.#transformer.transform(ast);
	}
}
