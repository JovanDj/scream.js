import { Resource } from "@scream.js/resource.js";
import express, { Express } from "express";
import type { Application } from "../application.interface.js";
import { Middleware } from "../middleware.js";
import { Router } from "../router.interface.js";
import type { ExpressFacade } from "./express-facade.js";
import { ExpressHttpContext } from "./express-http-context.js";
import { ExpressRequest } from "./express-request.js";
import { ExpressResponse } from "./express-response.js";
import { ExpressRouter } from "./express-router.js";

export interface Route {
  path: string;
  route: (router: Router) => void;
}

export class ExpressApplication implements Application<Express> {
  constructor(private readonly _facade: ExpressFacade) {}

  get app() {
    return this._facade.app;
  }

  listen(port?: number, cb?: () => void) {
    return this._facade.listen(port, cb);
  }

  createRouter(path: string, cb: (router: Router) => void) {
    const router = new ExpressRouter(express.Router());

    cb(router);

    this._facade.useRouter(path, router.router);
  }

  addRoutes(routes: Route[]) {
    for (const route of routes) {
      this.addRoute(route);
    }
  }

  addRoute(route: Route) {
    this.createRouter(route.path, route.route);
  }

  use(middleware: Middleware) {
    this._facade.use((req, res, next) =>
      middleware(
        new ExpressHttpContext(
          new ExpressRequest(req),
          new ExpressResponse(res),
          next,
        ),
      ),
    );

    return this;
  }

  resource(path: string, resource: Resource) {
    this.createRouter(path, (router) => {
      router.get("/", resource.index.bind(resource));
      router.get("/create", resource.create.bind(resource));
      router.get("/edit", resource.edit.bind(resource));
      router.get("/:id", resource.show.bind(resource));
      router.post("/", resource.store.bind(resource));
      router.patch("/:id", resource.update.bind(resource));
      router.delete("/:id", resource.delete.bind(resource));
    });
  }
}
