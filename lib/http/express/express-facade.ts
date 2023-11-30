import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Router } from "express";
import session from "express-session";
import helmet from "helmet";
import path from "node:path";
import nunjucks from "nunjucks";
import { ExpressServer } from "./express-server.js";

export class ExpressFacade {
  constructor(private readonly _app: ReturnType<typeof express>) {
    this._app.set("views", path.join(process.cwd(), "views"));
    this._app.set("view engine", "njk");

    nunjucks.configure("views", {
      autoescape: true,
      express: this._app,
    });
  }

  use(middleware: express.Handler) {
    this._app.use(middleware);
    return this;
  }

  useRouter(root: Parameters<typeof this._app.use>[0], router: Router) {
    return this._app.use(root, router);
  }

  route(path: string) {
    this._app.route(path);
    return this;
  }

  listen(port: Parameters<typeof this._app.listen>[0], callback?: () => void) {
    return new ExpressServer(this._app.listen(port, callback));
  }

  useErrorHandler(handler: express.ErrorRequestHandler) {
    this._app.use(handler);
    return this;
  }

  useStatic(
    path: Parameters<typeof this._app.use>[0],
    root: Parameters<typeof express.static>[0]
  ) {
    this._app.use(path, express.static(root));
    return this;
  }

  useCors() {
    this._app.use(cors());
    return this;
  }

  useHelmet() {
    this._app.use(helmet());
    return this;
  }

  useSession(
    options: session.SessionOptions = {
      secret: "secret",
      resave: false,
      saveUninitialized: false,
    }
  ) {
    this._app.use(session(options));
    return this;
  }

  useCookieParser() {
    this._app.use(cookieParser());
    return this;
  }

  useBodyParser() {
    this._app.use(express.json());
    return this;
  }
}
