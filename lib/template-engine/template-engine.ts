import { readFile } from "node:fs/promises";
import type { TemplateContext } from "./context.js";
import { Evaluator } from "./evaluator.js";
import { Generator } from "./generator.js";
import { Parser } from "./parser.ts";
import { Resolver } from "./resolver.js";
import { SystemFileLoader } from "./system-file-loader.ts";
import { Tokenizer } from "./tokenizer.ts";
import { Transformer } from "./transformer.ts";

export type { TemplateContext } from "./context.js";

export class ScreamTemplateEngine {
	readonly #resolver: Resolver;
	readonly #evaluator: Evaluator;
	readonly #generator: Generator;

	static create() {
		return new ScreamTemplateEngine(
			new Resolver(
				new SystemFileLoader(),
				new Tokenizer(),
				new Parser(),
				new Transformer(),
			),
			new Evaluator(),
			new Generator(),
		);
	}

	constructor(resolver: Resolver, evaluator: Evaluator, generator: Generator) {
		this.#resolver = resolver;
		this.#evaluator = evaluator;
		this.#generator = generator;
	}

	compile(template: string, context: TemplateContext) {
		const ast = this.#resolver.resolve(template);
		const evaluatedAst = this.#evaluator.evaluate(ast, { ...context });
		return this.#generator.generate(evaluatedAst);
	}

	async compileFile(filePath: string, options: TemplateContext) {
		const content = await readFile(filePath, { encoding: "utf-8" });
		return this.compile(content, { ...options });
	}
}
