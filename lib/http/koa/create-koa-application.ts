import Router from "@koa/router";
import { logger } from "config/logger";
import Koa from "koa";
import type { Application } from "../application.interface";
import { KoaApp } from "./koa-application";

export const createKoaApp: () => Application = () => {
	logger.log("Creating koa app");

	return new KoaApp(new Koa(), new Router());
};
