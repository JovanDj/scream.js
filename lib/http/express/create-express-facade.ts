import { ApplicationOptions } from "../create-application.js";
import { ExpressFacade } from "./express-facade.js";

const DEFAULT_PORT = 3000;

export function createExpressFacade(
  options: ApplicationOptions = {
    port: 3000,
  },
) {
  const port = options.port ?? DEFAULT_PORT;

  return new ExpressFacade()
    .useSession()
    .useBodyParser()
    .useCookieParser()
    .useCors()
    .useHelmet()
    .useSession()
    .setPort(port);
}
