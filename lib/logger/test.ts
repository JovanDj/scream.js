import { LoggerFactory } from "./logger-factory";
import { Logger } from "./logger.interface";
import { ScreamLogger } from "./scream-logger";

describe("ScreamLogger", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = LoggerFactory.createLogger();
  });

  it("should create logger", () => {
    expect(logger).toBeInstanceOf(ScreamLogger);
  });

  it("should log", () => {
    const spy = jest.spyOn(logger, "log");
    logger.log("test");
    expect(spy).toHaveBeenCalledWith("test");
    spy.mockRestore();
  });

  it("should log error", () => {
    const spy = jest.spyOn(logger, "error");
    logger.error("test");
    expect(spy).toHaveBeenCalledWith("test");
    spy.mockRestore();
  });
});
