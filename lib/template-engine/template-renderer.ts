import type { TemplateASTNode } from "./ast.js";
import type { RenderContext } from "./context.js";
import type { Evaluator } from "./evaluator.js";
import type { RenderNode } from "./render-node.js";

export type HtmlRendererContract = {
	render(nodes: readonly RenderNode[]): string;
};

export class TemplateRenderer {
	readonly #evaluator: Evaluator;
	readonly #htmlRenderer: HtmlRendererContract;

	constructor(evaluator: Evaluator, htmlRenderer: HtmlRendererContract) {
		this.#evaluator = evaluator;
		this.#htmlRenderer = htmlRenderer;
	}

	render(ast: readonly TemplateASTNode[], context: RenderContext) {
		const renderNodes = this.#evaluator.evaluate(ast, context);

		return this.#htmlRenderer.render(renderNodes);
	}
}
