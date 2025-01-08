import type { FileLoader } from "./file-loader.js";
import type { Generator } from "./generator.js";
import type { Parser } from "./parser.js";
import type { Tokenizer } from "./tokenizer.js";
import type { Transformer } from "./transformer.js";

export class ScreamTemplateEngine {
	readonly #fileLoader: FileLoader;
	readonly #tokenizer: Tokenizer;
	readonly #parser: Parser;
	readonly #transformer: Transformer;
	readonly #generator: Generator;

	constructor(
		fileLoader: FileLoader,
		tokenizer: Tokenizer,
		parser: Parser,
		transformer: Transformer,
		generator: Generator,
	) {
		this.#fileLoader = fileLoader;
		this.#tokenizer = tokenizer;
		this.#parser = parser;
		this.#transformer = transformer;
		this.#generator = generator;
	}

	async compileFile(path: string, context: Record<string, unknown>) {
		const template = await this.#fileLoader.loadFile(path);

		return this.compile(template, context);
	}

	compile(template: string, context: Record<string, unknown>) {
		const tokens = this.#tokenizer.tokenize(template);
		const ast = this.#parser.parse(tokens);
		const transformedAst = this.#transformer.transform(ast);
		return this.#generator.generate(transformedAst, context);
	}
}
