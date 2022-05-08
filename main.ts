import { EventEmitter } from "events";
import { createServer, IncomingMessage, ServerResponse } from "http";
import "reflect-metadata";
import { ConnectionFactory } from "./lib/database/connection-factory";
import { HTTPContext } from "./lib/http/http-context";
import { Request } from "./lib/http/request";
import { Response } from "./lib/http/response";
import { LoggerFactory } from "./lib/logger/logger-factory";
import { Logger } from "./lib/logger/logger.interface";
import { Router } from "./lib/router/router";
import { TodoGateway } from "./src/todos/todo-gateway";
import { TodoMapper } from "./src/todos/todo-mapper";
import { TodosController } from "./src/todos/todos.controller";

const app = async () => {
  const logger: Logger = LoggerFactory.createLogger();
  const db = await ConnectionFactory.createConnection();

  await db.run(
    "CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)"
  );

  const todoGateway = new TodoGateway(db);
  const todoMapper = new TodoMapper(todoGateway);
  const todosController = new TodosController(todoMapper);

  const router = new Router();

  router.get("/", async (context: HTTPContext) => {
    const body = {
      _links: {
        self: { href: "/" },
        todos: { href: "http://localhost:3000/todos" }
      }
    };

    return context.response.json(body);
  });

  router.get("/todos", async context => {
    const todos = await todosController.findAll();

    return context.response.json(todos);
  });

  router.post("/todos", async context => {
    const todo = await todosController.create();

    context.response.json(todo);
  });

  const server = createServer();
  server.listen(3000);

  for await (const [req, res] of EventEmitter.on(
    server,
    "request"
  ) as AsyncIterableIterator<[req: IncomingMessage, res: ServerResponse]>) {
    const httpContext = new HTTPContext(
      new Request(req),
      new Response(res),
      logger
    );

    switch (httpContext.request.url) {
      case "/todos":
        switch (httpContext.request.method) {
          case "GET":
            router.routes[1].handler(httpContext);
            break;
          case "POST":
            router.routes[2].handler(httpContext);
            break;
        }
        break;
      case "/":
        router.routes[0].handler(httpContext);
        break;
      default:
        httpContext.response.json({ status: 404, message: "Not Found" });
        break;
    }
  }

  return true;
};

app();
