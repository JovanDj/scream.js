import KoaRouter from "@koa/router";
import Koa from "koa";
import { KoaServer } from "./koa-server.js";

export class KoaFacade {
  constructor(
    private readonly _koa: Koa,
    private readonly _options: { port: number } = { port: 3333 }
  ) {}

  get app() {
    return this._koa;
  }

  get port() {
    return this._options.port;
  }

  use(middleware: Parameters<(typeof this.app)["use"]>[0]) {
    return this.app.use(middleware);
  }

  listen(port: number, cb: () => void) {
    return new KoaServer(this.app.listen(port, cb));
  }

  useRouter(prefix: Parameters<KoaRouter["prefix"]>[0], router: KoaRouter) {
    router.prefix(prefix);
    this.app.use(router.routes());
    this.app.use(router.allowedMethods());
  }
}
