import { ApplicationOptions } from "../create-application.js";
import { ExpressFacade } from "./express-facade.js";

export function createExpressFacade(
  options: ApplicationOptions = {
    port: 3000,
  }
) {
  return new ExpressFacade()
    .useSession()
    .useBodyParser()
    .useCookieParser()
    .useCors()
    .useHelmet()
    .useSession()
    .setPort(options.port);
}
