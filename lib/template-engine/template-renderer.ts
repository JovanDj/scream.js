import type { TemplateASTNode } from "./ast.js";
import type { RenderContext } from "./context.js";
import type { Evaluator } from "./evaluator.js";
import type { Generator } from "./generator.js";

export class TemplateRenderer {
	readonly #evaluator: Evaluator;
	readonly #generator: Generator;

	constructor(evaluator: Evaluator, generator: Generator) {
		this.#evaluator = evaluator;
		this.#generator = generator;
	}

	render(ast: readonly TemplateASTNode[], context: RenderContext) {
		const renderNodes = this.#evaluator.evaluate(ast, context);

		return this.#generator.generate(renderNodes);
	}
}
