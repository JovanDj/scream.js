import { Logger } from "./logger.interface.js";

export class ScreamLogger implements Logger {
  log(message: string) {
    console.log(message);
  }

  error(message: string) {
    console.error(message);
  }
}
