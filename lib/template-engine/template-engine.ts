import type { Generator } from "./generator.js";
import type { Parser } from "./parser.js";
import type { Tokenizer } from "./tokenizer.js";
import type { Transformer } from "./transformer.js";

export class ScreamTemplateEngine {
	readonly #tokenizer: Tokenizer;
	readonly #parser: Parser;
	readonly #transformer: Transformer;
	readonly #generator: Generator;

	constructor(
		tokenizer: Tokenizer,
		parser: Parser,
		transformer: Transformer,
		generator: Generator,
	) {
		this.#tokenizer = tokenizer;
		this.#parser = parser;
		this.#transformer = transformer;
		this.#generator = generator;
	}

	compile(template: string, context: Record<string, unknown>) {
		const tokens = this.#tokenizer.tokenize(template);
		const ast = this.#parser.parse(tokens);
		const transformedAst = this.#transformer.transform(ast);
		return this.#generator.generate(transformedAst, context);
	}
}
