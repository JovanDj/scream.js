import Router from "@koa/router";
import { logger } from "config/logger.js";
import Koa from "koa";
import type { Application } from "../application.interface.js";
import { KoaApp } from "./koa-application.js";

export const createKoaApp: () => Application = () => {
	logger.log("Creating koa app");

	return new KoaApp(new Koa(), new Router());
};
