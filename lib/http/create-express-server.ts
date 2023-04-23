import { createExpressFacade } from "./express-facade.js";
import { ExpressServer } from "./express-server.js";

export const createExpressServer = (
  options?: Parameters<typeof createExpressFacade>[0]
) => {
  return new ExpressServer(createExpressFacade(options));
};
