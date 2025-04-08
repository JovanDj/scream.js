import type { Evaluator } from "./evaluator.js";
import type { FileLoader } from "./file-loader.js";
import type { Generator } from "./generator.js";
import type { ASTNode, Parser } from "./parser.js";
import type { Tokenizer } from "./tokenizer.js";
import type { Transformer } from "./transformer.js";

export class ScreamTemplateEngine {
	readonly #fileLoader: FileLoader;
	readonly #tokenizer: Tokenizer;
	readonly #parser: Parser;
	readonly #transformer: Transformer;
	readonly #evaluator: Evaluator;
	readonly #generator: Generator;

	constructor(
		fileLoader: FileLoader,
		tokenizer: Tokenizer,
		parser: Parser,
		transformer: Transformer,
		evaluator: Evaluator,
		generator: Generator,
	) {
		this.#fileLoader = fileLoader;
		this.#tokenizer = tokenizer;
		this.#parser = parser;
		this.#transformer = transformer;
		this.#evaluator = evaluator;
		this.#generator = generator;
	}

	compileFile(path: string, context: Record<string, unknown>) {
		const template = this.#fileLoader.loadFile(path);

		return this.compile(template, context);
	}

	compile(template: string, context: Record<string, unknown>) {
		const tokens = this.#tokenizer.tokenize(template);
		const ast = this.#parser.parse(tokens);

		const finalAst = this.#checkExtends(ast);
		const evaluatedAst = this.#evaluator.evaluate(finalAst, { ...context });

		return this.#generator.generate(evaluatedAst);
	}

	#checkExtends(ast: readonly ASTNode[]): readonly ASTNode[] {
		const extendsNode = ast.find((node) => node.type === "extends");
		if (!extendsNode) {
			return ast;
		}

		const parentTemplate = this.#fileLoader.loadFile(extendsNode.value);
		const parentTokens = this.#tokenizer.tokenize(parentTemplate);
		const parentAST = this.#parser.parse(parentTokens);

		const mergedParent = this.#checkExtends(parentAST);

		return this.#transformer.applyBlockOverrides(mergedParent, ast);
	}
}
