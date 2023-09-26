/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { createExpressServer } from "./express/create-express-server.js";
import { createKoaServer } from "./koa/create-koa-server.js";
import type { Application } from "./server.interface.js";

type ServerImplementation = "express" | "koa";

interface ServerOptions {
  port: number;
}

const servers = new Map<
  ServerImplementation,
  (options: ServerOptions) => Application
>();

servers.set("express", createExpressServer);
servers.set("koa", createKoaServer);

export const createServer = (
  server: ServerImplementation = "express",
  options = { port: 3000 },
) => {
  return servers.get(server)!(options);
};
