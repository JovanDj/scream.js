import type { Logger } from "./logger.interface.js";

export class ScreamLogger implements Logger {
	log(message: string) {
		console.info(message);
	}

	error(message: string) {
		console.error(message);
	}
}
