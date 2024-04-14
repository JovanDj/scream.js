import { Resource } from "@scream.js/resource.js";
import { Middleware } from "./middleware.js";
import { Router } from "./router.interface.js";
import { Server } from "./server.js";

export interface Application {
  addRoutes(routes: { path: string; route: (router: Router) => void }[]): void;
  createRouter(path: string, cb: (router: Router) => void): unknown;
  listen(port?: number, cb?: () => void): Server;
  use(middleware: Middleware): Application;
  resource(path: string, resource: Resource): void;
}
