import { HTTPContext } from "./http-context.js";
import { KoaFacade } from "./koa-facade.js";
import { KoaResponse } from "./koa-response.js";
import { Request } from "./request.js";
import type { Server } from "./server.interface.js";

export class KoaServer implements Server {
  constructor(private readonly server: KoaFacade) {}

  listen(port: number, cb?: () => void) {
    return this.server.listen(port, cb ? cb : () => {});
  }

  get(path: string, handler: (context: HTTPContext) => void) {
    this.server.get(path, (ctx) => {
      handler(
        new HTTPContext(new Request(ctx.req), new KoaResponse(ctx.response))
      );
    });
  }

  post(path: string, handler: (context: HTTPContext) => unknown): void {
    this.server.post(path, (ctx) => {
      handler(
        new HTTPContext(new Request(ctx.req), new KoaResponse(ctx.response))
      );
    });
  }
  patch(path: string, handler: (context: HTTPContext) => unknown): void {
    this.server.patch(path, (ctx) => {
      handler(
        new HTTPContext(new Request(ctx.req), new KoaResponse(ctx.response))
      );
    });
  }
  put(path: string, handler: (context: HTTPContext) => unknown): void {
    this.server.put(path, (ctx) => {
      handler(
        new HTTPContext(new Request(ctx.req), new KoaResponse(ctx.response))
      );
    });
  }
  delete(path: string, handler: (context: HTTPContext) => unknown): void {
    this.server.delete(path, (ctx) => {
      handler(
        new HTTPContext(new Request(ctx.req), new KoaResponse(ctx.response))
      );
    });
  }
}
