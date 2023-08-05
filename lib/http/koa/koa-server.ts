import { HTTPContext } from "../http-context.js";
import { Server } from "../server.interface.js";
import { KoaFacade } from "./koa-facade.js";
import { KoaRequest } from "./koa-request.js";
import { KoaResponse } from "./koa-response.js";

export class KoaServer implements Server {
  constructor(private readonly server: KoaFacade) {}

  listen(port: number, cb?: () => void) {
    return this.server.listen(port, cb ? cb : () => {});
  }

  close() {
    this.server.close();
  }

  get(path: string, handler: (context: HTTPContext) => void) {
    this.server.get(path, (ctx) => {
      handler(
        new HTTPContext(
          new KoaRequest(ctx.request),
          new KoaResponse(ctx.response),
        ),
      );
    });
  }

  post(path: string, handler: (context: HTTPContext) => unknown) {
    this.server.post(path, (ctx) => {
      handler(
        new HTTPContext(
          new KoaRequest(ctx.request),
          new KoaResponse(ctx.response),
        ),
      );
    });
  }
  patch(path: string, handler: (context: HTTPContext) => unknown) {
    this.server.patch(path, (ctx) => {
      handler(
        new HTTPContext(
          new KoaRequest(ctx.request),
          new KoaResponse(ctx.response),
        ),
      );
    });
  }
  put(path: string, handler: (context: HTTPContext) => unknown) {
    this.server.put(path, (ctx) => {
      handler(
        new HTTPContext(
          new KoaRequest(ctx.request),
          new KoaResponse(ctx.response),
        ),
      );
    });
  }
  delete(path: string, handler: (context: HTTPContext) => unknown) {
    this.server.delete(path, (ctx) => {
      handler(
        new HTTPContext(
          new KoaRequest(ctx.request),
          new KoaResponse(ctx.response),
        ),
      );
    });
  }
}
