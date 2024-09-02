import Router from "@koa/router";
import Koa from "koa";
import { Application } from "../application.interface";
import { KoaApp } from "./koa-application";

export const createKoaApp: () => Application = () => {
  console.info("Creating koa app");

  return new KoaApp(new Koa(), new Router());
};
