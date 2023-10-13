import { ExpressFacade } from "./express-facade.js";

const DEFAULT_PORT = 3000;

interface CreateExpressFacadeOptions {
  port: number;
}

export function createExpressFacade(
  options: CreateExpressFacadeOptions = {
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
