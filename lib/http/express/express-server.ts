import { Request, Response, Router } from "express";
import { HTTPContext } from "../http-context.js";
import type { Server } from "../server.interface.js";
import type { ExpressFacade } from "./express-facade.js";
import { ExpressRequest } from "./express-request.js";
import { ExpressResponse } from "./express-response.js";
import { Handler } from "./handler.js";

export class ExpressServer implements Server {
  constructor(private readonly server: ExpressFacade) {}

  listen(port?: number, cb?: () => void) {
    return this.server.listen(port, cb);
  }

  close() {
    this.server.close();
  }

  get(path: string, handler: Handler) {
    this.server.get(path, (req, res) => handler(this.createContext(req, res)));
  }

  post(path: string, handler: (context: HTTPContext) => void) {
    this.server.post(path, (req, res) => handler(this.createContext(req, res)));
  }

  patch(path: string, handler: (context: HTTPContext) => void) {
    this.server.patch(path, (req, res) =>
      handler(this.createContext(req, res)),
    );
  }

  put(path: string, handler: (context: HTTPContext) => void) {
    this.server.patch(path, (req, res) =>
      handler(this.createContext(req, res)),
    );
  }

  delete(path: string, handler: (context: HTTPContext) => void) {
    this.server.delete(path, (req, res) =>
      handler(this.createContext(req, res)),
    );
  }

  createRouter() {
    return Router();
  }

  private createContext(req: Request, res: Response) {
    return new HTTPContext(new ExpressRequest(req), new ExpressResponse(res));
  }
}
