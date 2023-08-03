import express from "express";
import { ExpressFacade, ExpressOptions } from "./express-facade.js";

const DEFAULT_PORT = 3000;
const DEFAULT_MIDDLEWARE = [
  express.json(),
  express.urlencoded({ extended: true }),
];

interface CreateExpressFacadeOptions {
  port: number;
}

export function createExpressFacade(
  options: CreateExpressFacadeOptions = {
    port: 3000,
  },
) {
  const port = options.port ?? DEFAULT_PORT;
  const middleware = DEFAULT_MIDDLEWARE;
  const expressOptions: ExpressOptions = {
    port,
    middleware,
    static: ["/", "public"],
  };

  return new ExpressFacade(expressOptions)
    .useBodyParser()
    .useCookieParser()
    .useCors()
    .useHelmet()
    .useSession()
    .setPort(port);
}
