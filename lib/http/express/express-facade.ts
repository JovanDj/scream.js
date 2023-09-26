import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  Router,
  type ErrorRequestHandler,
  type Handler,
  type RequestHandler,
} from "express";
import session from "express-session";
import helmet from "helmet";
import path from "node:path";

export interface ExpressOptions {
  port: number;
  middleware: Handler[];
  static: Parameters<ExpressFacade["useStatic"]>;
}

export class ExpressFacade {
  private readonly _app = express();
  private readonly _server?: ReturnType<typeof this._app.listen>;
  private _port = 3000;

  constructor(options: ExpressOptions) {
    options.middleware.forEach((middleware) => {
      this.app.use(middleware);
    });

    this.app.set("views", path.join(process.cwd(), "views"));
    this.app.set("view engine", "ejs");
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

  get(path: string, handler: express.RequestHandler) {
    return this.app.get(path, handler);
  }

  setPort(port: number) {
    this._port = port;
    return this;
  }

  use(middleware: Handler) {
    this.app.use(middleware);
    return this;
  }

  useRouter(root: Parameters<typeof this.app.use>[0], router: Router) {
    return this.app.use(root, router);
  }

  post(path: string, handler: RequestHandler) {
    this.app.post(path, handler);
    return this;
  }

  put(path: string, handler: RequestHandler) {
    this.app.put(path, handler);
    return this;
  }

  patch(path: string, handler: RequestHandler) {
    this.app.patch(path, handler);
    return this;
  }

  delete(path: string, handler: RequestHandler) {
    this.app.delete(path, handler);
    return this;
  }

  route(path: string) {
    this.app.route(path);
    return this;
  }

  listen(
    port: Parameters<typeof this.app.listen>[0] = this.port,
    callback?: () => void,
  ) {
    return this.app.listen(port, callback);
  }

  useErrorHandler(handler: ErrorRequestHandler) {
    this.app.use(handler);
    return this;
  }

  useStatic(
    path: Parameters<typeof this.app.use>[0],
    root: Parameters<typeof express.static>[0],
  ) {
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

  useSession(
    options: session.SessionOptions = {
      secret: "secret",
      resave: false,
      saveUninitialized: false,
    },
  ) {
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

  close() {
    this.server?.close();
  }
}
