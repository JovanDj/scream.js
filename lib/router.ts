import { IncomingMessage, ServerResponse } from "http";
import { UsersController } from "../src/users/users.controller";
import { Injector } from "./injector";
export interface Route {
  path: string;
  method: string;
  handler: string;
}

export class Router {
  constructor(private _routes: Route[]) {}

  async match(req: IncomingMessage, res: ServerResponse) {
    const url = this.createUrl(req);

    // Iterate over routes array
    for (const { path, method, handler } of this._routes) {
      // Check if request matches any route
      if (this.compareRoutes(path, method, req)) {
        console.log(handler);

        res.write(JSON.stringify(await handler()));
        res.end();

        return;
      } else {
        return res.end("NOT FOUND");
      }
    }
  }

  private compareRoutes(path: string, method: string, req: IncomingMessage) {
    return path === req.url && method === req.method;
  }

  private createUrl(req: IncomingMessage) {
    return new URL(req.url || "/", `http://${req.headers.host}`);
  }
}
