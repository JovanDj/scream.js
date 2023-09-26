import { createExpressFacade } from "./create-express-facade.js";
import { ExpressApplication } from "./express-server.js";

export const createExpressServer = (
  options?: Parameters<typeof createExpressFacade>[0],
) => {
  return new ExpressApplication(createExpressFacade(options));
};
