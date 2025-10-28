import fs from "node:fs";
import { join } from "node:path";

import type { FileLoader } from "./file-loader.js";

export class SystemFileLoader implements FileLoader {
	loadFile(path: string) {
		return fs.readFileSync(join("views", path), "utf-8");
	}
}
