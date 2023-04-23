import express, {
  type RequestHandler,
  Router,
  type RouterOptions,
} from "express";
import type { Server } from "http";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import cookieParser from "cookie-parser";

interface ExpressOptions {
  port: number;
  middleware: express.Handler[];
}

export class ExpressFacade {
  private _app = express();
  private _server?: Server;
  private _port = 3000;

  constructor(options: ExpressOptions) {
    options.middleware.forEach((middleware) => {
      this.app.use(middleware);
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

  useRouter(root: string, router: Router) {
    return this.app.use(root, router);
  }

  get(path: string, handler: RequestHandler) {
    this.app.get(path, handler);
    return this;
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

  createRouter(options?: RouterOptions) {
    return Router(options);
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
