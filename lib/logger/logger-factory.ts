import { Console } from "node:console";
import { Logger } from "./logger.interface";
import { ScreamLogger } from "./scream-logger";

export class LoggerFactory {
  static createLogger(): Logger {
    return new ScreamLogger(
      new Console({
        stdout: process.stdout,
        stderr: process.stderr,
        colorMode: true
      })
    );
  }
}
