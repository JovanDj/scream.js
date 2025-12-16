import fs from "node:fs";
import path from "node:path";

import type { FileLoader } from "./file-loader.js";

export class SystemFileLoader implements FileLoader {
	private readonly baseDir: string;

	constructor(baseDir = path.join(process.cwd(), "views")) {
		this.baseDir = baseDir;
	}

	loadFile(filePath: string) {
		return fs.readFileSync(path.join(this.baseDir, filePath), "utf-8");
	}
}
