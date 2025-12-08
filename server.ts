import "source-map-support/register";
import { logger } from "./config/logger.js";
import { createApp } from "./main.js";

const { app, db } = createApp();

const server = app.listen(3000, () => {
	logger.log("Listening on port 3000");
});

const shutdown = async () => {
	server.close(async (err) => {
		if (err) {
			throw err;
		}

		await db.destroy();
	});
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
