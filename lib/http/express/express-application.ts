import { Resource } from "@scream.js/resource.js";
import express from "express";
import type { Application } from "../application.interface.js";
import { Middleware } from "../middleware.js";
import { Router } from "../router.interface.js";
import type { ExpressFacade } from "./express-facade.js";
import { ExpressRequest } from "./express-request.js";
import { ExpressResponse } from "./express-response.js";
import { ExpressRouter } from "./express-router.js";

export class ExpressApplication implements Application {
  constructor(private readonly _app: ExpressFacade) {}

  listen(port?: number, cb?: () => void) {
    return this._app.listen(port, cb);
  }

  createRouter(path: string, cb: (router: Router) => void) {
    const router = new ExpressRouter(express.Router());

    cb(router);

    this._app.useRouter(path, router.router);
  }

  use(middleware: Middleware) {
    this._app.use((req: express.Request<{}>, res: express.Response) =>
      middleware(new ExpressRequest(req), new ExpressResponse(res))
    );

    return this;
  }

  resource(path: string, resource: Resource) {
    this.createRouter(path, (router) => {
      router.get("/", async (ctx) => resource.index(ctx));
      router.get("/create", async (ctx) => resource.create(ctx));
      router.get("/edit", async (ctx) => resource.create(ctx));
      router.get("/:id", async (ctx) => resource.show(ctx));
      router.post("/", async (ctx) => resource.store(ctx));
      router.patch("/:id", async (ctx) => resource.update(ctx));
      router.delete("/:id", async (ctx) => resource.delete(ctx));
    });
  }
}
