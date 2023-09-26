import { HTTPContext } from "../http-context.js";
import { Application } from "../server.interface.js";
import { KoaFacade } from "./koa-facade.js";
import { KoaRequest } from "./koa-request.js";
import { KoaResponse } from "./koa-response.js";

export class KoaServer implements Application {
  constructor(private readonly app: KoaFacade) {}

  listen(port: number, cb?: () => void) {
    return this.app.listen(port, cb ? cb : () => {});
  }

  close() {
    this.app.close();
  }

  get(path: string, handler: (context: HTTPContext) => void) {
    this.app.get(path, (ctx) => {
      handler(
        new HTTPContext(
          new KoaRequest(ctx.request, this.app.router),
          new KoaResponse(ctx.response),
        ),
      );
    });
  }

  post(path: string, handler: (context: HTTPContext) => unknown) {
    this.app.post(path, (ctx) => {
      handler(
        new HTTPContext(
          new KoaRequest(ctx.request, this.app.router),
          new KoaResponse(ctx.response),
        ),
      );
    });
  }
  patch(path: string, handler: (context: HTTPContext) => unknown) {
    this.app.patch(path, (ctx) => {
      handler(
        new HTTPContext(
          new KoaRequest(ctx.request, this.app.router),
          new KoaResponse(ctx.response),
        ),
      );
    });
  }
  put(path: string, handler: (context: HTTPContext) => unknown) {
    this.app.put(path, (ctx) => {
      handler(
        new HTTPContext(
          new KoaRequest(ctx.request, this.app.router),
          new KoaResponse(ctx.response),
        ),
      );
    });
  }
  delete(path: string, handler: (context: HTTPContext) => unknown) {
    this.app.delete(path, (ctx) => {
      handler(
        new HTTPContext(
          new KoaRequest(ctx.request, this.app.router),
          new KoaResponse(ctx.response),
        ),
      );
    });
  }
}
