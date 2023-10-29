import Koa from "@koa/router";
import { Application } from "../application.interface.js";
import { Middleware } from "../middleware.js";
import { Router } from "../router.interface.js";
import { KoaFacade } from "./koa-facade.js";
import { KoaRequest } from "./koa-request.js";
import { KoaResponse } from "./koa-response.js";
import { KoaRouter } from "./koa-router.js";

export class KoaApplication implements Application {
  constructor(private readonly _app: KoaFacade) {}

  use(middleware: Middleware) {
    this._app.use((ctx) => {
      middleware(new KoaRequest(ctx.request), new KoaResponse(ctx.response));
    });

    return this;
  }

  listen(port: number, cb?: () => void) {
    return this._app.listen(port, cb ? cb : () => ({}));
  }

  createRouter(prefix: string, cb: (router: Router) => void) {
    const router = new KoaRouter(new Koa());

    cb(router);

    this._app.useRouter(prefix, router.router);
  }
}
