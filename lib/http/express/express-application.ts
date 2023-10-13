import express from "express";
import type { Application } from "../application.interface.js";
import { Router } from "../router.interface.js";
import type { ExpressFacade } from "./express-facade.js";
import { ExpressRouter } from "./express-router.js";

export class ExpressApplication implements Application {
  constructor(private readonly _app: ExpressFacade) {}

  get app() {
    return this._app;
  }

  listen(port?: number, cb?: () => void) {
    return this.app.listen(port, cb);
  }

  createRouter(path: string, cb: (router: Router) => void) {
    const router = new ExpressRouter(express.Router());

    cb(router);

    this.app.useRouter(path, router.router);
  }
}
