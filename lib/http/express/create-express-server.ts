import { ApplicationOptions } from "../create-application.js";
import { createExpressFacade } from "./create-express-facade.js";
import { ExpressApplication } from "./express-application.js";

export const createExpressServer = (options: ApplicationOptions) => {
  return new ExpressApplication(createExpressFacade(options));
};
