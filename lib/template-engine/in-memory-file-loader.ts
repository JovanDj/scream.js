import type { FileLoader } from "./file-loader.js";

export class InMemoryFileLoader implements FileLoader {
	readonly #files: Map<string, string>;

	constructor() {
		this.#files = new Map<string, string>();
	}

	setTemplate(path: string, template: string) {
		this.#files.set(path, template);
	}

	loadFile(path: string) {
		const template = this.#files.get(path);

		if (!this.#files.has(path) || !template) {
			throw new Error("No file.");
		}

		return template;
	}
}
