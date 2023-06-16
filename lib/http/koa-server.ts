import type { Server } from "./server.interface.js";
import { HTTPContext } from "./http-context.js";
import { Request } from "./request.js";
import { Response } from "./response.js";
import { KoaFacade } from "./koa-facade.js";

export class KoaServer implements Server {
  constructor(private readonly server: KoaFacade) {}

  listen(port: number, cb?: () => void) {
    return this.server.listen(port, cb ? cb : () => {});
  }

  get(path: string, handler: (context: HTTPContext) => void) {
    return this.server.get(path, (ctx) => {
      handler(new HTTPContext(new Request(ctx.req), new Response(ctx.res)));
    });
  }
}
