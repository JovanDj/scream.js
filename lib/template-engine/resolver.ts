import type { FileLoader } from "./file-loader.js";

export class Resolver {
	readonly #fileLoader: FileLoader;

	constructor(fileLoader: FileLoader) {
		this.#fileLoader = fileLoader;
	}

	resolve(template: string) {
		return template;
	}

	resolveView(viewName: string) {
		return this.#fileLoader.loadView(viewName);
	}
}
