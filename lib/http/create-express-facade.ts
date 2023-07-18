import express from "express";
import { type ExpressOptions, ExpressFacade } from "./express-facade";
import type { HelmetOptions } from "helmet";
import type { Session, SessionOptions } from "express-session";

const DEFAULT_PORT = 3000;
const DEFAULT_MIDDLEWARE = [
  express.json(),
  express.urlencoded({ extended: true }),
];

interface CreateExpressFacadeOptions {
  express: Partial<ExpressOptions>;
  helmet: HelmetOptions;
  session: SessionOptions;
}

export function createExpressFacade(
  options: CreateExpressFacadeOptions = {
    express: {},
    helmet: {},
    session: { secret: "secret", resave: false, saveUninitialized: false },
  }
) {
  const port = options.express.port ?? DEFAULT_PORT;
  const middleware = options.express.middleware ?? DEFAULT_MIDDLEWARE;
  const expressOptions: ExpressOptions = {
    port,
    middleware,
    static: ["/", "public"],
  };

  return new ExpressFacade(expressOptions)
    .useBodyParser()
    .useCookieParser()
    .useCors()
    .useHelmet(options.helmet)
    .useSession(options.session)
    .setPort(port);
}
