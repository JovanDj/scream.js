import Koa from "@koa/router";
import { Application } from "../application.interface.js";
import { Router } from "../router.interface.js";
import { KoaFacade } from "./koa-facade.js";
import { KoaRouter } from "./koa-router.js";

export class KoaApplication implements Application {
  constructor(private readonly app: KoaFacade) {}

  listen(port: number, cb?: () => void) {
    return this.app.listen(port, cb ? cb : () => {});
  }

  createRouter(prefix: string, cb: (router: Router) => void) {
    const router = new KoaRouter(new Koa());

    cb(router);

    this.app.useRouter(prefix, router.router);
  }
}
