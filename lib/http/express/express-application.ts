import { Resource } from "@scream.js/resource.js";
import express from "express";
import type { Application } from "../application.interface.js";
import { HttpContext } from "../http-context.js";
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
    this._app.use((req, res) =>
      middleware(
        new HttpContext(new ExpressRequest(req), new ExpressResponse(res))
      )
    );

    return this;
  }

  resource(path: string, resource: Resource) {
    this.createRouter(path, (router) => {
      router.get("/", resource.index.bind(resource));
      router.get("/create", resource.create.bind(resource));
      router.get("/edit", resource.edit.bind(resource)); // Assuming you meant `edit` here
      router.get("/:id", resource.show.bind(resource));
      router.post("/", resource.store.bind(resource));
      router.patch("/:id", resource.update.bind(resource));
      router.delete("/:id", resource.delete.bind(resource));
    });
  }
}
