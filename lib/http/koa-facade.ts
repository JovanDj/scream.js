import Koa from "koa";
import KoaRouter from "@koa/router";

export class KoaFacade {
  private _server?: ReturnType<(typeof this.app)["listen"]>;

  constructor(private readonly _koa: Koa, private readonly router: KoaRouter) {
    this.app.use(this.router.routes());
  }

  get app() {
    return this._koa;
  }

  get server() {
    return this._server;
  }

  use(middleware: Parameters<(typeof this.app)["use"]>[0]) {
    return this.app.use(middleware);
  }

  listen(port = 3000, cb: () => void) {
    const server = this.app.listen(port).on("listening", cb);
    this._server = server;
    return this.server;
  }

  get(
    name: Parameters<(typeof this.router)["get"]>[0],
    middleware: Parameters<(typeof this.router)["get"]>[1]
  ) {
    return this.router.get(name, middleware);
  }

  useRouter(
    prefix: Parameters<(typeof this.router)["prefix"]>[0],
    router: KoaRouter
  ) {
    return this.app.use(router.prefix(prefix).routes());
  }
}
