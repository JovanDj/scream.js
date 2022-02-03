import "reflect-metadata";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { TodosController } from "./src/todos/todos.controller";
import { Middleware } from "./lib/middleware";
import { RequestLogger } from "./middlewares/request-logger.middleware";
import { JSONMiddleware } from "./middlewares/json.middleware";
import { HTTPContext } from "./lib/http/http-context";
import { CorsMiddleware } from "./middlewares/cors.middleware";
import { RouterMiddleware } from "./middlewares/router.middleware";
import { on } from "events";

const todosController = new TodosController();

const router = new RouterMiddleware();
const json: Middleware = new JSONMiddleware();
const requestLogger: Middleware = new RequestLogger(json);
const cors: Middleware = new CorsMiddleware();

const middlewares: Set<Middleware> = new Set([cors, requestLogger, router]);

// const routes = [
//   {
//     path: "/todos",
//     method: "GET",
//     handler: todosController.find,
//   },
// ];

// const router = new Router(routes);

const main = async () => {
  const server = createServer();
  server.listen(3000);

  for await (const event of on(server, "request")) {
    const [req, res]: [req: IncomingMessage, res: ServerResponse] = event;

    const httpContext = new HTTPContext(req, res);
    const { response } = httpContext;

    for (const middleware of middlewares) {
      middleware.handle(httpContext);
    }
    response.end();
  }
};

main();
