import { ExpressServer } from "./express-server.js";
import { createExpressFacade } from "./create-express-facade.js";

export const createExpressServer = (
  options?: Parameters<typeof createExpressFacade>[0]
) => {
  return new ExpressServer(createExpressFacade(options));
};
