import Koa from "koa";
import { Server } from "../server.js";
export class KoaServer implements Server, Disposable {
  constructor(private readonly server: ReturnType<Koa["listen"]>) {}

  close() {
    this.server.close();
  }

  [Symbol.dispose]() {
    this.server.close();
  }
}
