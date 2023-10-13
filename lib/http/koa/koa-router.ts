import Koa from "@koa/router";
import koa from "koa";
import { Handler } from "../handler.js";
import { HTTPContext } from "../http-context.js";
import { type Router } from "../router.interface.js";
import { KoaRequest } from "./koa-request.js";
import { KoaResponse } from "./koa-response.js";

export class KoaRouter implements Router {
  constructor(private readonly _router: Koa) {}

  get router() {
    return this._router;
  }

  get(path: string, handler: Handler) {
    this.router.get(path, (ctx) => {
      const context = this.createContext(ctx);

      return handler(context);
    });
  }

  post(path: string, handler: Handler) {
    this.router.post(path, (ctx) => {
      const context = this.createContext(ctx);

      return handler(context);
    });
  }

  private createContext(ctx: koa.Context) {
    const request = new KoaRequest(ctx.request);
    const response = new KoaResponse(ctx.response);

    const context = new HTTPContext(request, response);
    return context;
  }
}
