import { Logger } from "./logger.interface.js";

export class ScreamLogger implements Logger {
  constructor(private readonly console: Console) {}
  log(message: string) {
    this.console.log(message);
  }

  error(message: string) {
    this.console.error(message);
  }
}
