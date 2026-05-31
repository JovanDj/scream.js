import type { RenderContext } from "./context.js";
import { Evaluator } from "./evaluator.js";
import { Generator } from "./generator.js";
import { Parser } from "./parser.js";
import { RenderError } from "./render-error.js";
import { Resolver } from "./resolver.js";
import { SystemFileLoader } from "./system-file-loader.js";
import { TemplateSyntaxError } from "./template-syntax-error.js";
import { Tokenizer } from "./tokenizer.js";
import { Transformer } from "./transformer.js";

export type { TemplateASTNode } from "./ast.js";
export type { RenderContext } from "./context.js";
export type { ExpressionNode, PathExpressionNode } from "./expression.js";
export type { RenderNode } from "./render-node.js";
export { TemplateSyntaxError } from "./template-syntax-error.js";

export class ScreamTemplateEngine {
	readonly #resolver: Resolver;
	readonly #tokenizer: Tokenizer;
	readonly #parser: Parser;
	readonly #transformer: Transformer;
	readonly #evaluator: Evaluator;
	readonly #generator: Generator;

	static create() {
		const fileLoader = new SystemFileLoader();
		const tokenizer = new Tokenizer();
		const parser = new Parser();

		return new ScreamTemplateEngine(
			new Resolver(fileLoader),
			tokenizer,
			parser,
			new Transformer(fileLoader, tokenizer, parser),
			new Evaluator(),
			new Generator(),
		);
	}

	constructor(
		resolver: Resolver,
		tokenizer: Tokenizer,
		parser: Parser,
		transformer: Transformer,
		evaluator: Evaluator,
		generator: Generator,
	) {
		this.#resolver = resolver;
		this.#tokenizer = tokenizer;
		this.#parser = parser;
		this.#transformer = transformer;
		this.#evaluator = evaluator;
		this.#generator = generator;
	}

	render(template: string, context: RenderContext) {
		const source = this.#resolver.resolve(template);
		const tokens = this.#tokenizer.tokenize(source);
		const ast = this.#parser.parse(tokens);
		const transformedAst = this.#transformer.transform(ast);
		const renderNodes = this.#evaluator.evaluate(transformedAst, {
			...context,
		});
		return this.#generator.generate(renderNodes);
	}

	renderView(viewName: string, context: RenderContext) {
		try {
			const source = this.#resolver.resolveView(viewName);
			const tokens = this.#tokenizer.tokenize(source);
			const ast = this.#parser.parse(tokens);
			const transformedAst = this.#transformer.transform(ast);
			const renderNodes = this.#evaluator.evaluate(transformedAst, {
				...context,
			});
			return this.#generator.generate(renderNodes);
		} catch (error) {
			if (
				error instanceof TemplateSyntaxError &&
				error.viewName === undefined
			) {
				throw new TemplateSyntaxError(error.syntaxMessage, {
					...(error.span === undefined ? {} : { span: error.span }),
					viewName,
				});
			}

			if (error instanceof RenderError && error.viewName === undefined) {
				throw new RenderError(error.renderMessage, {
					expression: error.expression,
					viewName,
				});
			}

			throw error;
		}
	}
}
