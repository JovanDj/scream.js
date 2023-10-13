import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Router } from "express";
import session from "express-session";
import helmet from "helmet";
import path from "node:path";
import { ExpressServer } from "./express-server.js";

export class ExpressFacade {
  private readonly _app = express();
  private _port = 3000;

  constructor() {
    this.app.set("views", path.join(process.cwd(), "views"));
    this.app.set("view engine", "ejs");
  }

  get app() {
    return this._app;
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

  use(middleware: express.Handler) {
    this.app.use(middleware);
    return this;
  }

  useRouter(root: Parameters<typeof this.app.use>[0], router: Router) {
    return this.app.use(root, router);
  }

  post(path: string, handler: express.RequestHandler) {
    this.app.post(path, handler);
    return this;
  }

  put(path: string, handler: express.RequestHandler) {
    this.app.put(path, handler);
    return this;
  }

  patch(path: string, handler: express.RequestHandler) {
    this.app.patch(path, handler);
    return this;
  }

  delete(path: string, handler: express.RequestHandler) {
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
    return new ExpressServer(this.app.listen(port, callback));
  }

  useErrorHandler(handler: express.ErrorRequestHandler) {
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
}
