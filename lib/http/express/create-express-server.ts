import { createExpressFacade } from "./create-express-facade.js";
import { ExpressApplication } from "./express-application.js";

export const createExpressServer = () => {
  return new ExpressApplication(createExpressFacade());
};
