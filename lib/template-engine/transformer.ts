import type { FileLoader } from "./file-loader.js";
import type { ASTNode, Parser } from "./parser.js";
import type { Tokenizer } from "./tokenizer.js";

export class Transformer {
	readonly #fileLoader: FileLoader;
	readonly #tokenizer: Tokenizer;
	readonly #parser: Parser;

	constructor(fileLoader: FileLoader, tokenizer: Tokenizer, parser: Parser) {
		this.#fileLoader = fileLoader;
		this.#tokenizer = tokenizer;
		this.#parser = parser;
	}

	transform(ast: ASTNode[]): ASTNode[] {
		// Find the `{% extends %}` node
		const extendsNode = ast.find((node) => node.type === "extends");
		if (!extendsNode) {
			return ast; // No layout, return the AST as-is
		}

		// Load and parse the layout
		// Step 2: Load and parse the parent template
		const parentTemplate = this.#fileLoader.loadFile(extendsNode.value);
		const parentTokens = this.#tokenizer.tokenize(parentTemplate);
		const parentAST = this.#parser.parse(parentTokens);

		// Step 3: Replace blocks in the parent AST with content from the child AST
		return this.replaceBlocks(parentAST, ast);
	}

	private replaceBlocks(parentAST: ASTNode[], childAST: ASTNode[]) {
		// Map child blocks for quick lookup
		const childBlocks = new Map(
			childAST
				.filter((node) => node.type === "block")
				.map((block) => [block.value, block]),
		);

		// Replace blocks in the parent AST
		return parentAST.map((node) => {
			const childBlock = childBlocks.get(node.value);
			if (node.type === "block" && childBlocks.has(node.value) && childBlock) {
				return { ...node, children: childBlock.children };
			}
			return node;
		});
	}
}
