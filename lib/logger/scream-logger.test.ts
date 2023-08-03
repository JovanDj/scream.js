import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger-factory.js";
import { Logger } from "./logger.interface.js";
import { ScreamLogger } from "./scream-logger.js";

describe.concurrent("ScreamLogger", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = createLogger();
  });

  it("should create logger", () => {
    expect(logger).toBeInstanceOf(ScreamLogger);
  });

  it("should log", () => {
    const spy = vi.spyOn(logger, "log");
    logger.log("test");

    expect(spy).toHaveBeenCalledWith("test");
  });

  it("should log error", () => {
    const spy = vi.spyOn(logger, "error");
    logger.error("test");

    expect(spy).toHaveBeenCalledWith("test");
  });
});
