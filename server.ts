import "source-map-support/register";
import { logger } from "./config/logger.js";
import { createApp } from "./main.js";

createApp().app.listen(3000, () => {
	logger.log("Listening on port 3000");
});
