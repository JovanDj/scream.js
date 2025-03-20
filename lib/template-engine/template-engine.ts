import type { Evaluator } from "./evaluator.js";
import type { Generator } from "./generator.js";
import type { Resolver } from "./resolver.js";

export class ScreamTemplateEngine {
	readonly #resolver: Resolver;
	readonly #evaluator: Evaluator;
	readonly #generator: Generator;

	constructor(resolver: Resolver, evaluator: Evaluator, generator: Generator) {
		this.#resolver = resolver;
		this.#evaluator = evaluator;
		this.#generator = generator;
	}

	compileFile(path: string, context: Record<string, unknown>) {
		const ast = this.#resolver.resolveFile(path);
		const evaluatedAst = this.#evaluator.evaluate(ast, { ...context });
		return this.#generator.generate(evaluatedAst);
	}

	compile(template: string, context: Record<string, unknown>) {
		const ast = this.#resolver.resolve(template);
		const evaluatedAst = this.#evaluator.evaluate(ast, { ...context });
		return this.#generator.generate(evaluatedAst);
	}
}
