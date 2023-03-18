import "reflect-metadata";

import {
  createServer,
  IncomingMessage,
  ServerResponse,
  STATUS_CODES,
} from "node:http";

export interface HTTPContext {
  req: IncomingMessage;
  res: Response;
}

export type Handler = (context: HTTPContext) => void;

export class Response {
  constructor(private readonly response: ServerResponse) {}

  json(body: unknown) {
    return this.response.end(JSON.stringify(body));
  }

  end(chunk: unknown) {
    return this.response.end(chunk);
  }
}
export class Router {
  private readonly _layers = new Map<string, Handler>();
  private readonly _routes = new Map<string, typeof this.layers>();

  get layers() {
    return this._layers;
  }

  get routes() {
    return this._routes;
  }

  get(path: string, handler: Handler) {
    return this.routes.set("GET", this.layers.set(path, handler));
  }

  match(req: IncomingMessage, res: ServerResponse) {
    const { method = "GET", url = "/" } = req;

    console.log({ method, url });
    return this.routes.get(method)?.get(url)?.({ req, res: new Response(res) });
  }
}
export class Application {
  constructor(private readonly _router: Router) {}

  get router() {
    return this._router;
  }

  createServer() {
    return createServer((req, res) => {
      try {
        return this.router.match(req, res);
      } catch (error) {
        res.writeHead(404);
        res.write(STATUS_CODES[404]);
        return res.end();
      }
    });
  }
}
