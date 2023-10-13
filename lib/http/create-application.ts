/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { Application } from "./application.interface.js";
import { createExpressServer } from "./express/create-express-server.js";
import { createKoaServer } from "./koa/create-koa-server.js";

type ApplicationImplementation = "express" | "koa";

export interface ApplicationOptions {
  port: number;
}

const servers = new Map<
  ApplicationImplementation,
  (options: ApplicationOptions) => Application
>();

servers.set("express", createExpressServer);
servers.set("koa", createKoaServer);

export const createServer = (
  server: ApplicationImplementation = "express",
  options = { port: 3000 },
) => {
  return servers.get(server)!(options);
};
