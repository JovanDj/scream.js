import { Resource } from "@scream.js/resource.js";
import Express, { Router } from "express";
import { callbackify } from "node:util";
import type { Application } from "../application.interface.js";
import { Handler } from "../handler.js";
import { Middleware } from "../middleware.js";
import { ResourceProxy } from "../resource-proxy.js";
import { ExpressHttpContext } from "./express-http-context.js";

export class ExpressApp implements Application {
  readonly #express: Express.Application;

  constructor(express: Express.Application) {
    this.#express = express;
  }

  get(path: string, handler: Handler) {
    this.#express.get(path, (req, res, next) =>
      handler(new ExpressHttpContext(req, res, next)),
    );

    return this;
  }

  post(path: string, handler: Handler) {
    this.#express.post(path, (req, res, next) =>
      handler(new ExpressHttpContext(req, res, next)),
    );

    return this;
  }

  patch(path: string, handler: Handler) {
    this.#express.patch(path, (req, res, next) =>
      handler(new ExpressHttpContext(req, res, next)),
    );

    return this;
  }

  delete(path: string, handler: Handler) {
    this.#express.delete(path, (req, res, next) =>
      handler(new ExpressHttpContext(req, res, next)),
    );

    return this;
  }

  listen(port: number, cb?: () => void) {
    this.#express.listen(port, cb);

    return this;
  }

  use(middleware: Middleware) {
    this.#express.use((req, res, next) => {
      const context = new ExpressHttpContext(req, res, next);

      callbackify(middleware)(context, next);
    });

    return this;
  }

  resource(path: string, resource: Readonly<Resource>) {
    const proxy = new ResourceProxy(resource);

    const router = Router();

    router.get("/", (req, res, next) => {
      const context = new ExpressHttpContext(req, res, next);
      callbackify(proxy.index.bind(proxy))(context, next);
    });

    router.get("/create", (req, res, next) => {
      const context = new ExpressHttpContext(req, res, next);
      callbackify(proxy.create.bind(proxy))(context, next);
    });

    router.get("/:id/edit", (req, res, next) => {
      const context = new ExpressHttpContext(req, res, next);
      callbackify(proxy.edit.bind(proxy))(context, next);
    });

    router.get("/:id", (req, res, next) => {
      const context = new ExpressHttpContext(req, res, next);
      callbackify(proxy.show.bind(proxy))(context, next);
    });

    router.post("/", (req, res, next) => {
      const context = new ExpressHttpContext(req, res, next);
      callbackify(proxy.store.bind(proxy))(context, next);
    });

    router.patch("/:id", (req, res, next) => {
      const context = new ExpressHttpContext(req, res, next);
      callbackify(proxy.update.bind(proxy))(context, next);
    });

    router.delete("/:id", (req, res, next) => {
      const context = new ExpressHttpContext(req, res, next);
      callbackify(proxy.delete.bind(proxy))(context, next);
    });

    this.#express.use(path, router);

    return this;
  }
}
