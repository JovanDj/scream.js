import type { FileLoader } from "./file-loader.js";
import type { ASTNode, Parser } from "./parser.js";
import type { Tokenizer } from "./tokenizer.js";
import type { Transformer } from "./transformer.js";

export class Resolver {
	readonly #fileLoader: FileLoader;
	readonly #tokenizer: Tokenizer;
	readonly #parser: Parser;
	readonly #transformer: Transformer;

	constructor(
		fileLoader: FileLoader,
		tokenizer: Tokenizer,
		parser: Parser,
		transformer: Transformer,
	) {
		this.#fileLoader = fileLoader;
		this.#tokenizer = tokenizer;
		this.#parser = parser;
		this.#transformer = transformer;
	}

	resolve(template: string) {
		const tokens = this.#tokenizer.tokenize(template);
		const ast = this.#parser.parse(tokens);
		return this.#resolveRecursive(ast, []);
	}

	#resolveRecursive(
		ast: readonly ASTNode[],
		chain: readonly string[],
	): readonly ASTNode[] {
		const extendsNode = ast.find((n) => {
			return n.type === "extends";
		});

		if (!extendsNode) {
			return ast;
		}

		const name = extendsNode.value;

		if (!name) {
			throw new Error("Missing template name in extends node");
		}

		if (chain.includes(name)) {
			throw new Error(
				`Cyclic extends detected: ${[...chain, name].join(" → ")}`,
			);
		}

		const parentTemplate = this.#fileLoader.loadFile(name);
		const parentTokens = this.#tokenizer.tokenize(parentTemplate);
		const parentAst = this.#parser.parse(parentTokens);

		const resolvedParent = this.#resolveRecursive(parentAst, [...chain, name]);

		return this.#transformer.transform(resolvedParent, ast);
	}
}
