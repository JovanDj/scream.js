import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type RequestHandler } from "express";
import session from "express-session";
import helmet from "helmet";
import { ExpressRouter } from "../router/express-router";
import { createExpressRouter } from "../router/express-router-factory";
import { HTTPContext } from "./http-context";
import { Request } from "./request";
import { Response } from "./response";
import { Server } from "./server.interface";
interface ExpressOptions {
  port: number;
  middleware: express.Handler[];
}

export class ExpressFacade implements Server {
  private _app = express();
  private _server?: Server;
  private _port = 3000;

  constructor(options: ExpressOptions) {
    options.middleware.forEach((middleware) => {
      this.app.use(middleware);
    });
  }
  get(path: string, handler: (context: HTTPContext) => void) {
    return this.app.get(path, (req, res) => {
      const request = new Request(req);
      const response = new Response(res);
      return handler(new HTTPContext(request, response));
    });
  }

  get app() {
    return this._app;
  }

  get server() {
    return this._server;
  }

  get port() {
    return this._port;
  }

  setPort(port: number) {
    this._port = port;
    return this;
  }

  use(middleware: express.Handler) {
    this.app.use(middleware);
    return this;
  }

  useRouter(root: string, router: ExpressRouter) {
    return this.app.use(root, router.router);
  }

  post(path: string, handler: RequestHandler) {
    this.app.post(path, handler);
    return this;
  }

  put(path: string, handler: RequestHandler) {
    this.app.put(path, handler);
    return this;
  }

  delete(path: string, handler: RequestHandler) {
    this.app.delete(path, handler);
    return this;
  }

  listen(port: number, callback?: () => void) {
    return this.app.listen(port || this.port, callback);
  }

  useErrorHandler(handler: express.ErrorRequestHandler) {
    this.app.use(handler);
    return this;
  }

  useStatic(path: string, root: string) {
    this.app.use(path, express.static(root));
    return this;
  }

  useCors() {
    this.app.use(cors());
    return this;
  }

  useHelmet() {
    this.app.use(helmet());
    return this;
  }

  useSession(options?: session.SessionOptions) {
    this.app.use(session(options));
    return this;
  }

  useCookieParser() {
    this.app.use(cookieParser());
    return this;
  }

  useBodyParser() {
    this.app.use(express.json());
    return this;
  }

  createRouter(options: Parameters<typeof express.Router>[0]) {
    return createExpressRouter(options);
  }
}

const DEFAULT_PORT = 3000;
const DEFAULT_MIDDLEWARE = [
  express.json(),
  express.urlencoded({ extended: true }),
];

export function createExpressFacade(options: Partial<ExpressOptions> = {}) {
  const port = options.port ?? DEFAULT_PORT;
  const middleware = options.middleware ?? DEFAULT_MIDDLEWARE;
  const expressOptions: ExpressOptions = { port, middleware };

  return new ExpressFacade(expressOptions)
    .useBodyParser()
    .useCookieParser()
    .useCors()
    .useHelmet()
    .useSession({ secret: "secret" })
    .setPort(port);
}
