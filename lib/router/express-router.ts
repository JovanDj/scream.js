import express from "express";
import { ExpressRequest } from "../http/express/express-request.js";
import { ExpressResponse } from "../http/express/express-response.js";
import { HTTPContext } from "../http/http-context.js";
import { type Router } from "./router.interface.js";
export class ExpressRouter implements Router {
  constructor(private readonly _router: express.Router) {}

  get router() {
    return this._router;
  }

  get(path: string, handler: (context: HTTPContext) => void) {
    return this._router.get(path, (req, res) => {
      const request = new ExpressRequest(req);
      const response = new ExpressResponse(res);
      const context = new HTTPContext(request, response);

      return handler(context);
    });
  }
  post(path: string, handler: (context: HTTPContext) => void) {
    return this._router.post(path, (req, res) => {
      const request = new ExpressRequest(req);
      const response = new ExpressResponse(res);

      return handler(new HTTPContext(request, response));
    });
  }
}
