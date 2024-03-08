import { logger } from "./config/logger.js";
import { app } from "./main.js";
export const server = app.listen(3000, () => {
  logger.log("Listening on port 3000");
});
