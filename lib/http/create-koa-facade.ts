import { KoaFacade } from "./koa-facade";
import Koa from "koa";
import KoaRouter from "@koa/router";

export function createKoaFacade({ port }: { port: number }) {
  return new KoaFacade(new Koa(), new KoaRouter());
}
