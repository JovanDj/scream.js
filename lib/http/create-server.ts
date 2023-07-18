/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createExpressServer } from "./create-express-server.js";
import { createKoaServer } from "./create-koa-server.js";
import type { Server } from "./server.interface.js";

type ServerImplementation = "express" | "koa";

const servers = new Map<ServerImplementation, () => Server>();
servers.set("express", createExpressServer);
servers.set("koa", createKoaServer);

export const createServer = (server: ServerImplementation = "express") => {
  return servers.has(server)
    ? servers.get(server)!()
    : servers.get("express")!();
};
