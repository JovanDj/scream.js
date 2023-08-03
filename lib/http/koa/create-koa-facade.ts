import KoaRouter from "@koa/router";
import Koa from "koa";
import { KoaFacade } from "./koa-facade.js";

export function createKoaFacade(options: { port: number } = { port: 3333 }) {
  return new KoaFacade(new Koa({}), new KoaRouter(), options);
}
