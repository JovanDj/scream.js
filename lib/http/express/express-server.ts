import express from "express";
import { ExpressRouter } from "../../router/express-router.js";
import { Router } from "../../router/router.interface.js";
import type { Application } from "../server.interface.js";
import type { ExpressFacade } from "./express-facade.js";

export class ExpressApplication implements Application {
  constructor(private readonly _app: ExpressFacade) {}

  get app() {
    return this._app;
  }

  listen(port?: number, cb?: () => void) {
    return this.app.listen(port, cb);
  }

  close() {
    this.app.close();
  }

  createRouter(path: string, cb: (router: Router) => void) {
    const router = new ExpressRouter(express.Router());

    cb(router);

    this.app.useRouter(path, router.router);
  }
}
