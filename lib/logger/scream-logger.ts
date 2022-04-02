import { Logger } from "./logger.interface";

export class ScreamLogger implements Logger {
  constructor(private readonly console: Console) {}
  log(message: string) {
    this.console.log(message);
  }

  error(message: string | unknown) {
    this.console.error(message);
  }
}
