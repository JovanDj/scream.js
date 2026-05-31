import type { FileLoader } from "./file-loader.js";

export class InMemoryFileLoader implements FileLoader {
	readonly #files: { filename: string; template: string }[] = [];

	setTemplate(path: string, template: string) {
		const existingFile = this.#files.find((file) => file.filename === path);

		if (existingFile) {
			existingFile.template = template;
			return;
		}

		this.#files.push({ filename: path, template });
	}

	loadView(viewName: string) {
		this.#assertValidViewName(viewName);
		const file = this.#files.find((entry) => entry.filename === viewName);

		if (!file) {
			throw new Error(`No file: ${viewName}`);
		}

		return file.template;
	}

	#assertValidViewName(viewName: string) {
		const normalizedViewName = viewName.replaceAll("\\", "/");

		if (
			viewName.includes(":") ||
			normalizedViewName.startsWith("/") ||
			normalizedViewName.startsWith("./") ||
			normalizedViewName.startsWith("../") ||
			normalizedViewName.includes("/./") ||
			normalizedViewName.includes("/../") ||
			!normalizedViewName.endsWith(".scream")
		) {
			throw new Error(`Invalid view name: ${viewName}`);
		}
	}
}
