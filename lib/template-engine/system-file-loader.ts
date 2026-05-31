import fs from "node:fs";
import path from "node:path";

import type { FileLoader } from "./file-loader.js";

export class SystemFileLoader implements FileLoader {
	readonly #viewsRoot: string;

	constructor(viewsRoot = path.join(process.cwd(), "views")) {
		this.#viewsRoot = viewsRoot;
	}

	loadView(viewName: string) {
		this.#assertValidViewName(viewName);
		const resolvedPath = path.resolve(this.#viewsRoot, viewName);
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

	#assertValidViewName(viewName: string) {
		const normalizedViewName = viewName.replaceAll("\\", "/");

		if (
			path.extname(viewName) !== ".scream" ||
			normalizedViewName.startsWith("./") ||
			normalizedViewName.startsWith("../") ||
			normalizedViewName.includes("/./") ||
			normalizedViewName.includes("/../")
		) {
			throw new Error(`Invalid view name: ${viewName}`);
		}
	}
}
