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
    return this.server.get(path, (req, res) =>
      handler(new HTTPContext(new Request(req), new Response(res)))
    );
  }
}
