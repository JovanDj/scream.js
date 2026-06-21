import fs from "node:fs";
import path from "node:path";

import type { FileLoader } from "./file-loader.js";

export type TemplateGroupFileLoaderOptions = {
	readonly viewsRoot?: string;
	readonly groups: readonly string[];
};

export class TemplateGroupFileLoader implements FileLoader {
	readonly #viewsRoot: string;
	readonly #groups: readonly string[];

	constructor(options: TemplateGroupFileLoaderOptions) {
		if (options.groups.length === 0) {
			throw new Error("Template groups must not be empty");
		}

		this.#viewsRoot = options.viewsRoot ?? path.join(process.cwd(), "views");
		this.#groups = options.groups.map((group) => {
			this.#assertValidGroupName(group);
			return group;
		});
	}

	loadView(viewName: string) {
		this.#assertValidViewName(viewName);
		const template = this.#loadFromGroups(viewName, this.#groups);

		if (template !== undefined) {
			return template;
		}

		throw new Error(`No file: ${viewName}`);
	}

	#loadFromGroups(
		viewName: string,
		groups: readonly string[],
	): string | undefined {
		const group = groups[0];

		if (group === undefined) {
			return undefined;
		}

		const resolvedPath = this.#resolveViewPath(group, viewName);

		if (fs.existsSync(resolvedPath)) {
			return fs.readFileSync(resolvedPath, "utf-8");
		}

		return this.#loadFromGroups(viewName, groups.slice(1));
	}

	#resolveViewPath(group: string, viewName: string) {
		const groupRoot = path.resolve(this.#viewsRoot, group);
		const resolvedPath = path.resolve(groupRoot, viewName);
		const relativePath = path.relative(groupRoot, resolvedPath);

		if (this.#isOutsideRoot(relativePath)) {
			throw new Error(`Invalid view name: ${viewName}`);
		}

		return resolvedPath;
	}

	#assertValidGroupName(group: string) {
		const normalizedGroupName = group.replaceAll("\\", "/");
		const groupRoot = path.resolve(this.#viewsRoot, group);
		const relativePath = path.relative(this.#viewsRoot, groupRoot);

		if (
			group.length === 0 ||
			group.includes(":") ||
			path.isAbsolute(group) ||
			normalizedGroupName.startsWith("./") ||
			normalizedGroupName.startsWith("../") ||
			normalizedGroupName.includes("/./") ||
			normalizedGroupName.includes("/../") ||
			this.#isOutsideRoot(relativePath)
		) {
			throw new Error(`Invalid template group: ${group}`);
		}
	}

	#assertValidViewName(viewName: string) {
		const normalizedViewName = viewName.replaceAll("\\", "/");

		if (
			path.extname(viewName) !== ".scream" ||
			viewName.includes(":") ||
			viewName.includes("\\") ||
			path.isAbsolute(viewName) ||
			normalizedViewName.startsWith("/") ||
			normalizedViewName.startsWith("./") ||
			normalizedViewName.startsWith("../") ||
			normalizedViewName.includes("/./") ||
			normalizedViewName.includes("/../")
		) {
			throw new Error(`Invalid view name: ${viewName}`);
		}
	}

	#isOutsideRoot(relativePath: string) {
		return relativePath === ".." || relativePath.startsWith(`..${path.sep}`);
	}
}
