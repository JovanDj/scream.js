import { createKoaFacade } from "./create-koa-facade.js";
import { KoaServer } from "./koa-server.js";

export const createKoaServer = () => {
  return new KoaServer(createKoaFacade());
};
