import type { RenderContext } from "./context.js";
import { Evaluator } from "./evaluator.js";
import type { FileLoader } from "./file-loader.js";
import { HtmlRenderer } from "./html-renderer.js";
import { Parser } from "./parser.js";
import { RenderError } from "./render-error.js";
import { SystemFileLoader } from "./system-file-loader.js";
import { TemplateCompiler } from "./template-compiler.js";
import {
	type HtmlRendererContract,
	TemplateRenderer,
} from "./template-renderer.js";
import { TemplateSyntaxError } from "./template-syntax-error.js";
import { Tokenizer } from "./tokenizer.js";

export type { TemplateASTNode } from "./ast.js";
export type { RenderContext } from "./context.js";
export type { ExpressionNode, PathExpressionNode } from "./expression.js";
export type { RenderNode } from "./render-node.js";
export type {
	HtmlAttributeEntry,
	HtmlAttributeValue,
} from "./render-values.js";
export {
	FormattedDate,
	FormattedNumber,
	HtmlAttributes,
	SafeHtml,
} from "./render-values.js";
export {
	TemplateGroupFileLoader,
	type TemplateGroupFileLoaderOptions,
} from "./template-group-file-loader.js";
export type { HtmlRendererContract } from "./template-renderer.js";
export { TemplateSyntaxError } from "./template-syntax-error.js";

export class ScreamTemplateEngine {
	readonly #compiler: TemplateCompiler;
	readonly #renderer: TemplateRenderer;

	static create(
		fileLoader: FileLoader = new SystemFileLoader(),
		htmlRenderer: HtmlRendererContract = new HtmlRenderer(),
	) {
		const tokenizer = new Tokenizer();
		const parser = new Parser();

		return new ScreamTemplateEngine(
			new TemplateCompiler(fileLoader, tokenizer, parser),
			new TemplateRenderer(new Evaluator(), htmlRenderer),
		);
	}

	constructor(compiler: TemplateCompiler, renderer: TemplateRenderer) {
		this.#compiler = compiler;
		this.#renderer = renderer;
	}

	render(template: string, context: RenderContext) {
		const ast = this.#compiler.compile(template);

		return this.#renderer.render(ast, { ...context });
	}

	renderView(viewName: string, context: RenderContext) {
		try {
			const ast = this.#compiler.compileView(viewName);

			return this.#renderer.render(ast, { ...context });
		} catch (error) {
			throw this.#withViewName(error, viewName);
		}
	}

	#withViewName(error: unknown, viewName: string) {
		if (error instanceof TemplateSyntaxError && error.viewName === undefined) {
			return new TemplateSyntaxError(error.syntaxMessage, {
				...(!error.span ? {} : { span: error.span }),
				viewName,
			});
		}

		if (error instanceof RenderError && error.viewName === undefined) {
			return new RenderError(error.renderMessage, {
				expression: error.expression,
				viewName,
			});
		}

		return error;
	}
}
