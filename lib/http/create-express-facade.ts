import express from "express";
import { type ExpressOptions, ExpressFacade } from "./express-facade";

const DEFAULT_PORT = 3000;
const DEFAULT_MIDDLEWARE = [
  express.json(),
  express.urlencoded({ extended: true }),
];

type CreateExpressFacadeOptions = Partial<ExpressOptions>;

export function createExpressFacade(options: CreateExpressFacadeOptions = {}) {
  const port = options.port ?? DEFAULT_PORT;
  const middleware = options.middleware ?? DEFAULT_MIDDLEWARE;
  const expressOptions: ExpressOptions = { port, middleware };

  return new ExpressFacade(expressOptions)
    .useBodyParser()
    .useCookieParser()
    .useCors()
    .useHelmet()
    .useSession({ secret: "secret", resave: false, saveUninitialized: false })
    .setPort(port);
}
