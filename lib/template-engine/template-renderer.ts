import type { TemplateASTNode } from "./ast.js";
import type { RenderContext } from "./context.js";
import type { Evaluator } from "./evaluator.js";
import type { HtmlRenderer } from "./html-renderer.js";

export class TemplateRenderer {
	readonly #evaluator: Evaluator;
	readonly #htmlRenderer: HtmlRenderer;

	constructor(evaluator: Evaluator, htmlRenderer: HtmlRenderer) {
		this.#evaluator = evaluator;
		this.#htmlRenderer = htmlRenderer;
	}

	render(ast: readonly TemplateASTNode[], context: RenderContext) {
		const renderNodes = this.#evaluator.evaluate(ast, context);

		return this.#htmlRenderer.render(renderNodes);
	}
}
