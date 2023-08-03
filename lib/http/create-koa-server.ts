import { createKoaFacade } from "./create-koa-facade.js";
import { KoaServer } from "./koa-server.js";

export const createKoaServer = (options: { port: number } = { port: 3333 }) => {
  return new KoaServer(createKoaFacade(options));
};
