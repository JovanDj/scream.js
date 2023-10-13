import express from "express";
import { Handler } from "../handler.js";
import { HTTPContext } from "../http-context.js";
import { type Router } from "../router.interface.js";
import { ExpressRequest } from "./express-request.js";
import { ExpressResponse } from "./express-response.js";

export class ExpressRouter implements Router {
  constructor(private readonly _router: express.Router) {}

  get router() {
    return this._router;
  }

  get(path: string, handler: Handler) {
    this.router.get(path, (req, res) => {
      const context = this.createContext(req, res);

      return handler(context);
    });
  }

  post(path: string, handler: Handler) {
    this.router.post(path, (req, res) => {
      const context = this.createContext(req, res);

      return handler(context);
    });
  }

  private createContext(req: express.Request, res: express.Response) {
    const request = new ExpressRequest(req);
    const response = new ExpressResponse(res);

    const context = new HTTPContext(request, response);
    return context;
  }
}
