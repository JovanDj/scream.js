import { ApplicationOptions } from "../create-application.js";
import { createKoaFacade } from "./create-koa-facade.js";
import { KoaApplication } from "./koa-application.js";

export const createKoaServer = (options: ApplicationOptions) => {
  return new KoaApplication(createKoaFacade(options));
};
