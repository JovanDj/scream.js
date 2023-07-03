import { createExpressServer } from "./create-express-server";
import { createKoaServer } from "./create-koa-server";
import type { Server } from "./server.interface";

const servers = new Map<"express" | "koa", () => Server>();
servers.set("express", createExpressServer);
servers.set("koa", createKoaServer);

export const createServer = (server: "express" | "koa" = "express") => {
  return servers.has(server)
    ? servers.get(server)!()
    : servers.get("express")!();
};
