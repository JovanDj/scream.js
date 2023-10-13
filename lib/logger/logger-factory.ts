import { Logger } from "./logger.interface.js";
import { ScreamLogger } from "./scream-logger.js";

export const createLogger: () => Logger = () => new ScreamLogger();
