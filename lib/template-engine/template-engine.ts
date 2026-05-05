import type { RenderContext } from "./context.js";
import { Evaluator } from "./evaluator.js";
import { Generator } from "./generator.js";
import { Parser } from "./parser.js";
import { Resolver } from "./resolver.js";
import { SystemFileLoader } from "./system-file-loader.js";
import { Tokenizer } from "./tokenizer.js";
import { Transformer } from "./transformer.js";

export type { RenderContext } from "./context.js";

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

	render(template: string, context: RenderContext) {
		const ast = this.#resolver.resolve(template);
		const evaluatedAst = this.#evaluator.evaluate(ast, { ...context });
		return this.#generator.generate(evaluatedAst);
	}

	renderView(viewName: string, context: RenderContext) {
		const ast = this.#resolver.resolveView(viewName);
		const evaluatedAst = this.#evaluator.evaluate(ast, { ...context });
		return this.#generator.generate(evaluatedAst);
	}
}
