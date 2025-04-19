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

		const finalAst = this.#resolveTemplateInheritance(ast, []);
		const evaluatedAst = this.#evaluator.evaluate(finalAst, { ...context });

		return this.#generator.generate(evaluatedAst);
	}

	#resolveTemplateInheritance(
		childAst: readonly ASTNode[],
		parentChain: readonly string[],
	): readonly ASTNode[] {
		const extendsNode = childAst.find((node) => node.type === "extends");
		if (!extendsNode) {
			return childAst;
		}

		const parentTemplateName = extendsNode.value;

		if (parentChain.includes(parentTemplateName)) {
			throw new Error(
				`Cyclic extends detected: ${[...parentChain, parentTemplateName].join(" → ")}`,
			);
		}

		const parentTemplate = this.#fileLoader.loadFile(parentTemplateName);
		const parentTokens = this.#tokenizer.tokenize(parentTemplate);
		const parentAst = this.#parser.parse(parentTokens);
		const resolvedParentAst = this.#resolveTemplateInheritance(parentAst, [
			...parentChain,
			parentTemplateName,
		]);

		return this.#transformer.applyBlockOverrides(resolvedParentAst, childAst);
	}
}
