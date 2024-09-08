import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger-factory.js";
import type { Logger } from "./logger.interface.js";
import { ScreamLogger } from "./scream-logger.js";

describe("ScreamLogger", () => {
	let logger: Logger;

	beforeEach(() => {
		logger = createLogger();
	});

	it("should create logger", () => {
		expect(logger).toBeInstanceOf(ScreamLogger);
	});

	it("should log", () => {
		const spy = vi.spyOn(console, "info");
		logger.log("test");

		expect(spy).toHaveBeenCalledWith("test");
	});

	it("should log error", () => {
		const spy = vi.spyOn(console, "error");
		logger.error("test");

		expect(spy).toHaveBeenCalledWith("test");
	});
});
