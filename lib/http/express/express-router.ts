import { Resource } from "@scream.js/resource.js";
import express from "express";
import { Handler } from "../handler.js";
import { HttpContext } from "../http-context.js";
import { type Router } from "../router.interface.js";
import { ExpressRequest } from "./express-request.js";
import { ExpressResponse } from "./express-response.js";

export class ExpressRouter implements Router {
  constructor(private readonly _router: express.Router) {}

  get router() {
    return this._router;
  }

  get(path: string, handler: Handler) {
    this._router.get<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>
    >(path, (req, res) => {
      const context = this._createContext(req, res);

      return handler(context);
    });
  }

  post(path: string, handler: Handler) {
    this._router.post<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>
    >(path, (req, res) => {
      const context = this._createContext(req, res);

      return handler(context);
    });
  }

  patch(path: string, handler: Handler) {
    this._router.patch<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>
    >(path, (req, res) => {
      const context = this._createContext(req, res);

      return handler(context);
    });
  }

  delete(path: string, handler: Handler) {
    this._router.delete<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>
    >(path, (req, res) => {
      const context = this._createContext(req, res);

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

  private _createContext(
    req: express.Request<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>
    >,
    res: express.Response
  ) {
    const request = new ExpressRequest(req);
    const response = new ExpressResponse(res);

    const context = new HttpContext(request, response);
    return context;
  }
}
