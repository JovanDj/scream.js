import express from "express";
import { ExpressResponse } from "../http/express-response";
import { HTTPContext } from "../http/http-context";
import { Request } from "../http/request";
import { type Router } from "./router.interface";
export class ExpressRouter implements Router {
  constructor(private readonly _router: express.Router) {}

  get router() {
    return this._router;
  }

  get(path: string, handler: (context: HTTPContext) => void) {
    return this._router.get(path, (req, res) => {
      const request = new Request(req);
      const response = new ExpressResponse(res);
      const context = new HTTPContext(request, response);

      return handler(context);
    });
  }
  post(path: string, handler: (context: HTTPContext) => void) {
    return this._router.post(path, (req, res) => {
      const request = new Request(req);
      const response = new ExpressResponse(res);

      return handler(new HTTPContext(request, response));
    });
  }
}
