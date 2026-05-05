import fs from "node:fs";
import path from "node:path";

import type { FileLoader } from "./file-loader.js";

export class SystemFileLoader implements FileLoader {
	readonly #viewsRoot: string;

	constructor(viewsRoot = path.join(process.cwd(), "views")) {
		this.#viewsRoot = viewsRoot;
	}

	loadView(viewName: string) {
		const filename = path.extname(viewName) ? viewName : `${viewName}.scream`;
		const resolvedPath = path.resolve(this.#viewsRoot, filename);
		const relativePath = path.relative(this.#viewsRoot, resolvedPath);

		if (
			path.isAbsolute(viewName) ||
			relativePath.startsWith("..") ||
			path.isAbsolute(relativePath)
		) {
			throw new Error(`Invalid view name: ${viewName}`);
		}

		return fs.readFileSync(resolvedPath, "utf-8");
	}
}
