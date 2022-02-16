import { EventEmitter } from "events";
import { createServer, IncomingMessage, ServerResponse } from "http";
import "reflect-metadata";
import { HTTPContext } from "./lib/http/http-context";
import { Middleware } from "./lib/middleware";
import { Route, Router } from "./lib/router";
import { CorsMiddleware } from "./middlewares/cors.middleware";
import { JSONMiddleware } from "./middlewares/json.middleware";
import { RequestLogger } from "./middlewares/request-logger.middleware";
import { TodosController } from "./src/todos/todos.controller";

const todosController = new TodosController();

// const router: Middleware = new RouterMiddleware();
const json: Middleware = new JSONMiddleware();
const requestLogger: Middleware = new RequestLogger();
const cors: Middleware = new CorsMiddleware();

const middlewares: Set<Middleware> = new Set([cors, requestLogger, json]);

const routes: Route[] = [
  {
    path: "/",
    method: "GET",
    handler: (context: HTTPContext) => {
      const body = {
        _links: {
          self: { href: "/" },
          todos: { href: "http://localhost:3000/todos" }
        }
      };
      context.response.writeHead(200, {
        "Content-Length": Buffer.byteLength(JSON.stringify(body))
      });

      return JSON.stringify(body);
    }
  },
  {
    path: "/todos",
    method: "GET",
    handler: todosController.find
  }
];

const router = new Router(routes);
export const server = createServer();

const app = async () => {
  for await (const [req, res] of EventEmitter.on(
    server,
    "request"
  ) as AsyncIterableIterator<[req: IncomingMessage, res: ServerResponse]>) {
    const httpContext = new HTTPContext(req, res);

    for (const middleware of middlewares) {
      middleware.handle(httpContext);
    }

    return router.match(httpContext);
  }
};

app();
