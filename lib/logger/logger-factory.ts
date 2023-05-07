import { Console } from "node:console";
import { ScreamLogger } from "./scream-logger";

export class LoggerFactory {
  static createLogger() {
    return new ScreamLogger(
      new Console({
        stdout: process.stdout,
        stderr: process.stderr,
        colorMode: true,
      })
    );
  }
}
