import { Console } from "node:console";
import { stderr, stdout } from "node:process";
import { Logger } from "./logger.interface";
import { ScreamLogger } from "./scream-logger";

describe("ScreamLogger", () => {
  let logger: Logger;
  let console: Console;

  beforeEach(() => {
    console = new Console({ stdout, stderr, colorMode: true });
    logger = new ScreamLogger(console);
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
