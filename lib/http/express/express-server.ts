import { Request, Response, Router } from "express";
import { HTTPContext } from "../http-context.js";
import type { Application } from "../server.interface.js";
import type { ExpressFacade } from "./express-facade.js";
import { ExpressRequest } from "./express-request.js";
import { ExpressResponse } from "./express-response.js";
import { Handler } from "./handler.js";

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

  get(path: string, handler: Handler) {
    this.app.get(path, (req, res) => handler(this.createContext(req, res)));
    return this;
  }

  post(path: string, handler: (context: HTTPContext) => void) {
    this.app.post(path, (req, res) => handler(this.createContext(req, res)));
    return this;
  }

  patch(path: string, handler: (context: HTTPContext) => void) {
    this.app.patch(path, (req, res) => handler(this.createContext(req, res)));
  }

  put(path: string, handler: (context: HTTPContext) => void) {
    this.app.patch(path, (req, res) => handler(this.createContext(req, res)));
  }

  delete(path: string, handler: (context: HTTPContext) => void) {
    this.app.delete(path, (req, res) => handler(this.createContext(req, res)));
  }

  route(path: string) {
    this.app.route(path);
    return this;
  }

  createRouter() {
    return Router();
  }

  private createContext(req: Request, res: Response) {
    return new HTTPContext(new ExpressRequest(req), new ExpressResponse(res));
  }
}
