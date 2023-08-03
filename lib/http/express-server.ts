import type { ExpressFacade } from "./express-facade.js";
import { ExpressResponse } from "./express-response.js";
import { HTTPContext } from "./http-context.js";
import { Request } from "./request.js";
import type { Server } from "./server.interface.js";

export class ExpressServer implements Server {
  constructor(private readonly server: ExpressFacade) {}

  listen(port?: number, cb?: () => void) {
    return this.server.listen(port, cb);
  }

  close() {
    this.server.close();
  }

  get(path: string, handler: (context: HTTPContext) => void) {
    this.server.get(path, (req, res) =>
      handler(new HTTPContext(new Request(req), new ExpressResponse(res))),
    );
  }

  post(path: string, handler: (context: HTTPContext) => void) {
    this.server.post(path, (req, res) =>
      handler(new HTTPContext(new Request(req), new ExpressResponse(res))),
    );
  }

  patch(path: string, handler: (context: HTTPContext) => void) {
    this.server.patch(path, (req, res) =>
      handler(new HTTPContext(new Request(req), new ExpressResponse(res))),
    );
  }

  put(path: string, handler: (context: HTTPContext) => void) {
    this.server.patch(path, (req, res) =>
      handler(new HTTPContext(new Request(req), new ExpressResponse(res))),
    );
  }

  delete(path: string, handler: (context: HTTPContext) => void) {
    this.server.delete(path, (req, res) =>
      handler(new HTTPContext(new Request(req), new ExpressResponse(res))),
    );
  }
}
