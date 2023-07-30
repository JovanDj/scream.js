import { Console } from "node:console";
import { Logger } from "./logger.interface.js";
import { ScreamLogger } from "./scream-logger.js";

export const createLogger: () => Logger = () =>
  new ScreamLogger(
    new Console({
      stdout: process.stdout,
      stderr: process.stderr,
      colorMode: true,
    }),
  );
