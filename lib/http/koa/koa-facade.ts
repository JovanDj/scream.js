import KoaRouter from "@koa/router";
import Koa from "koa";

export class KoaFacade {
  private _server?: ReturnType<(typeof this.app)["listen"]>;

  constructor(
    private readonly _koa: Koa,
    private readonly _router: KoaRouter,
    private readonly _options: { port: number } = { port: 3333 },
  ) {
    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());
  }

  get app() {
    return this._koa;
  }

  get server() {
    return this._server;
  }

  get port() {
    return this._options.port;
  }

  use(middleware: Parameters<(typeof this.app)["use"]>[0]) {
    return this.app.use(middleware);
  }

  listen(port = 3000, cb: () => void) {
    const server = this.app.listen(port).on("listening", cb);
    this._server = server;
    return this.server;
  }

  get router() {
    return this._router;
  }

  get(
    name: Parameters<(typeof this.router)["get"]>[0],
    middleware: Parameters<(typeof this.router)["get"]>[1],
  ) {
    this.router.get(name, middleware);
    console.log(name);
    return this.router;
  }

  post(
    name: Parameters<(typeof this.router)["get"]>[0],
    middleware: Parameters<(typeof this.router)["get"]>[1],
  ) {
    return this.router.post(name, middleware);
  }

  patch(
    name: Parameters<(typeof this.router)["get"]>[0],
    middleware: Parameters<(typeof this.router)["get"]>[1],
  ) {
    return this.router.patch(name, middleware);
  }

  put(
    name: Parameters<(typeof this.router)["get"]>[0],
    middleware: Parameters<(typeof this.router)["get"]>[1],
  ) {
    return this.router.post(name, middleware);
  }

  delete(
    name: Parameters<(typeof this.router)["get"]>[0],
    middleware: Parameters<(typeof this.router)["get"]>[1],
  ) {
    return this.router.delete(name, middleware);
  }

  useRouter(
    prefix: Parameters<(typeof this.router)["prefix"]>[0],
    router: KoaRouter,
  ) {
    return this.app.use(router.prefix(prefix).routes());
  }

  close() {
    this.server?.close();
  }
}
