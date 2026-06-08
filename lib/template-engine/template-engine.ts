import type { RenderContext } from "./context.js";
import { Evaluator } from "./evaluator.js";
import type { FileLoader } from "./file-loader.js";
import { Generator } from "./generator.js";
import { Parser } from "./parser.js";
import { RenderError } from "./render-error.js";
import { SystemFileLoader } from "./system-file-loader.js";
import { TemplateCompiler } from "./template-compiler.js";
import { TemplateRenderer } from "./template-renderer.js";
import { TemplateSyntaxError } from "./template-syntax-error.js";
import { Tokenizer } from "./tokenizer.js";
import { Transformer } from "./transformer.js";

export type { TemplateASTNode } from "./ast.js";
export type { RenderContext } from "./context.js";
export type { ExpressionNode, PathExpressionNode } from "./expression.js";
export type { RenderNode } from "./render-node.js";
export { TemplateSyntaxError } from "./template-syntax-error.js";

export class ScreamTemplateEngine {
	readonly #fileLoader: FileLoader;
	readonly #compiler: TemplateCompiler;
	readonly #renderer: TemplateRenderer;

	static create(fileLoader: FileLoader = new SystemFileLoader()) {
		const tokenizer = new Tokenizer();
		const parser = new Parser();
		const transformer = new Transformer(fileLoader, tokenizer, parser);

		return new ScreamTemplateEngine(
			fileLoader,
			new TemplateCompiler(tokenizer, parser, transformer),
			new TemplateRenderer(new Evaluator(), new Generator()),
		);
	}

	constructor(
		fileLoader: FileLoader,
		compiler: TemplateCompiler,
		renderer: TemplateRenderer,
	) {
		this.#fileLoader = fileLoader;
		this.#compiler = compiler;
		this.#renderer = renderer;
	}

	render(template: string, context: RenderContext) {
		const ast = this.#compiler.compile(template);

		return this.#renderer.render(ast, { ...context });
	}

	renderView(viewName: string, context: RenderContext) {
		const template = this.#fileLoader.loadView(viewName);

		try {
			return this.render(template, context);
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
