import { KoaFacade } from "./koa-facade";
import Koa from "koa";
import KoaRouter from "@koa/router";

export function createKoaFacade() {
  return new KoaFacade(new Koa(), new KoaRouter());
}
