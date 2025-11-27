import { readFile } from "node:fs/promises";
import type { TemplateContext } from "./context.js";
import type { Evaluator } from "./evaluator.js";
import type { Generator } from "./generator.js";
import type { Resolver } from "./resolver.js";

export type { TemplateContext } from "./context.js";

export class ScreamTemplateEngine {
	readonly #resolver: Resolver;
	readonly #evaluator: Evaluator;
	readonly #generator: Generator;

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
