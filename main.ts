import { EventEmitter } from "events";
import { createServer, IncomingMessage, ServerResponse } from "http";
import "reflect-metadata";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { HTTPContext } from "./lib/http/http-context";
import { Middleware } from "./lib/middleware";
import { Route, Router } from "./lib/router";
import { CorsMiddleware } from "./middlewares/cors.middleware";
import { JSONMiddleware } from "./middlewares/json.middleware";
import { RequestLogger } from "./middlewares/request-logger.middleware";
import { TodoGateway } from "./src/todos/todo-gateway";
import { TodoMapper } from "./src/todos/todo-mapper";
import { TodosController } from "./src/todos/todos.controller";

const app = async () => {
  console.log("ok");
  const db = await open({
    filename: "test-database.db",
    driver: sqlite3.Database
  });

  await db.run(
    "CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)"
  );

  const todoGateway = new TodoGateway(db);
  const todoMapper = new TodoMapper(todoGateway);
  const todosController = new TodosController(todoMapper);

  // const router: Middleware = new RouterMiddleware();
  const json: Middleware = new JSONMiddleware();
  const requestLogger: Middleware = new RequestLogger();
  const cors: Middleware = new CorsMiddleware();

  const middlewares: Set<Middleware> = new Set([cors, requestLogger, json]);

  const routes: Route[] = [
    {
      path: "/",
      method: "GET",
      handler: async (context: HTTPContext) => {
        const body = {
          _links: {
            self: { href: "/" },
            todos: { href: "http://localhost:3000/todos" }
          }
        };

        return body;
      }
    },
    {
      path: "/todos",
      method: "GET",
      handler: async (context: HTTPContext) => {
        return JSON.stringify(await todosController.findAll(context));
      }
    },
    {
      path: "/todos",
      method: "POST",
      handler: todosController.create
    }
  ];

  const router = new Router(routes);
  const server = createServer();
  server.listen(3000);

  for await (const [req, res] of EventEmitter.on(
    server,
    "request"
  ) as AsyncIterableIterator<[req: IncomingMessage, res: ServerResponse]>) {
    const httpContext = new HTTPContext(req, res);

    console.log(httpContext.request.url);

    if (
      httpContext.request.method === "GET" &&
      httpContext.request.url === "/"
    ) {
      const response = await routes[0].handler(httpContext);
      console.log(response);
      httpContext.response.writeHead(200, {
        "Content-Type": "text/plain",
        "Content-Length": Buffer.byteLength(JSON.stringify(response))
      });

      httpContext.response.write(JSON.stringify(response));
      return httpContext.response.end();
    } else {
      httpContext.response.writeHead(404);
    }

    // for (const middleware of middlewares) {
    //   middleware.handle(httpContext);
    // }

    // return router.match(httpContext);
  }
};

app().then();
