import { Logger } from "../lib/logger/logger.interface.js";
import { ScreamLogger } from "../lib/logger/scream-logger.js";

export const logger: Logger = new ScreamLogger();
