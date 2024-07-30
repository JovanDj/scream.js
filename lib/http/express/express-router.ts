import { Resource } from "@scream.js/resource.js";
import express from "express";
import { Handler } from "../handler.js";
import { type Router } from "../router.interface.js";
import { ExpressHttpContext } from "./express-http-context.js";
import { ExpressRequest } from "./express-request.js";
import { ExpressResponse } from "./express-response.js";

export class ExpressRouter implements Router {
  constructor(private readonly _router: express.Router) {}

  get router() {
    return this._router;
  }

  get(path: string, handler: Handler) {
    this._router.get(path, (req, res, next) => {
      const context = this._createContext(req, res, next);

      return handler(context);
    });
  }

  post(path: string, handler: Handler) {
    this._router.post(path, (req, res, next) => {
      const context = this._createContext(req, res, next);

      return handler(context);
    });
  }

  patch(path: string, handler: Handler) {
    this._router.patch(path, (req, res, next) => {
      const context = this._createContext(req, res, next);

      return handler(context);
    });
  }

  delete(path: string, handler: Handler) {
    this._router.delete(path, (req, res, next) => {
      const context = this._createContext(req, res, next);

      return handler(context);
    });
  }

  resource(path: string, resource: Resource) {
    this.get(path, resource.index.bind(resource));
    this.get(path, resource.show.bind(resource));
    this.get(`${path}/create`, resource.create.bind(resource));
    this.post(path, resource.store.bind(resource));
    this.patch(path, resource.update.bind(resource));
    this.delete(path, resource.delete.bind(resource));
  }

  private _createContext(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const request = new ExpressRequest(req);
    const response = new ExpressResponse(res);

    const context = new ExpressHttpContext(request, response, next);
    return context;
  }
}
