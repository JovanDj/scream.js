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
		this.#assertUniqueBlocks(ast);
		return this.#resolveRecursive(ast, []);
	}

	#assertUniqueBlocks(ast: readonly ASTNode[]) {
		const blocks = new Set<string>();

		for (const node of ast) {
			if (node.type === "block") {
				if (!node.value) {
					throw new Error("Template block is missing a name");
				}
				if (blocks.has(node.value)) {
					throw new Error(`Duplicate template block: ${node.value}`);
				}
				blocks.add(node.value);
			}
		}
	}

	resolveView(viewName: string) {
		const template = this.#fileLoader.loadView(viewName);
		return this.resolve(template);
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

		const firstMeaningfulNode = ast.find((node) => {
			return node.type !== "text" || (node.value ?? "").trim() !== "";
		});

		if (firstMeaningfulNode !== extendsNode) {
			throw new Error("Extends must be the first meaningful directive");
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

		const parentTemplate = this.#fileLoader.loadView(name);
		const parentTokens = this.#tokenizer.tokenize(parentTemplate);
		const parentAst = this.#parser.parse(parentTokens);

		const resolvedParent = this.#resolveRecursive(parentAst, [...chain, name]);

		return this.#transformer.transform(resolvedParent, ast);
	}
}
