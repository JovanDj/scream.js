import Koa from "@koa/router";
import { Resource } from "@scream.js/resource.js";
import koa from "koa";
import { Handler } from "../handler.js";
import { HttpContext } from "../http-context.js";
import { type Router } from "../router.interface.js";
import { KoaRequest } from "./koa-request.js";
import { KoaResponse } from "./koa-response.js";

export class KoaRouter implements Router {
  constructor(private readonly _router: Koa) {}

  get router() {
    return this._router;
  }

  get(path: string, handler: Handler) {
    this._router.get(path, (ctx) => {
      const context = this._createContext(ctx);

      return handler(context);
    });
  }

  post(path: string, handler: Handler) {
    this._router.post(path, (ctx) => {
      const context = this._createContext(ctx);

      return handler(context);
    });
  }

  patch(path: string, handler: Handler): void {
    this._router.patch(path, (ctx) => {
      const context = this._createContext(ctx);

      return handler(context);
    });
  }

  delete(path: string, handler: Handler): void {
    this._router.delete(path, (ctx) => {
      const context = this._createContext(ctx);

      return handler(context);
    });
  }

  resource(path: string, resource: Resource) {
    this.get(path, (ctx) => resource.findAll(ctx));
    this.get(path, (ctx) => resource.findOne(ctx));
    this.post(path, (ctx) => resource.create(ctx));
    this.patch(path, (ctx) => resource.update(ctx));
    this.delete(path, (ctx) => resource.delete(ctx));
  }

  private _createContext(ctx: koa.Context) {
    const request = new KoaRequest(ctx.request);
    const response = new KoaResponse(ctx.response);

    const context = new HttpContext(request, response);
    return context;
  }
}
