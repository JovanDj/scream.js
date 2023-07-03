import type { Server } from "./server.interface.js";
import type { ExpressFacade } from "./express-facade.js";
import { HTTPContext } from "./http-context.js";
import { Request } from "./request.js";
import { Response } from "./response.js";

export class ExpressServer implements Server {
  constructor(private readonly server: ExpressFacade) {}

  listen(port: number, cb?: () => void) {
    return this.server.listen(port, cb);
  }

  get(path: string, handler: (context: HTTPContext) => void) {
    this.server.get(path, (req, res) =>
      handler(new HTTPContext(new Request(req), new Response(res)))
    );
  }

  post(path: string, handler: (context: HTTPContext) => void) {
    this.server.post(path, (req, res) =>
      handler(new HTTPContext(new Request(req), new Response(res)))
    );
  }

  patch(path: string, handler: (context: HTTPContext) => void) {
    this.server.patch(path, (req, res) =>
      handler(new HTTPContext(new Request(req), new Response(res)))
    );
  }

  put(path: string, handler: (context: HTTPContext) => void) {
    this.server.patch(path, (req, res) =>
      handler(new HTTPContext(new Request(req), new Response(res)))
    );
  }

  delete(path: string, handler: (context: HTTPContext) => void) {
    this.server.delete(path, (req, res) =>
      handler(new HTTPContext(new Request(req), new Response(res)))
    );
  }
}
