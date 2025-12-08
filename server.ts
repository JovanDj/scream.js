import "source-map-support/register";
import { startHttpServer } from "@scream.js/http/server.js";
import { createApp } from "./main.js";

const { app, db, logger } = createApp();

startHttpServer({ app, db, logger, port: 3000 });
