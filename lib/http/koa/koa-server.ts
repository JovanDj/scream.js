import Koa from "koa";
import { Server } from "../server.js";
export class KoaServer implements Server, Disposable {
  constructor(private readonly _server: ReturnType<Koa["listen"]>) {}

  get server() {
    return this._server;
  }

  close() {
    this._server.close();
  }

  [Symbol.dispose]() {
    this._server.close();
  }
}
