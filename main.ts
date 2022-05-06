import { EventEmitter } from "events";
import { createServer, IncomingMessage, ServerResponse } from "http";
import "reflect-metadata";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { HTTPContext } from "./lib/http/http-context";
import { routes } from "./routes";
import { UsersController } from "./src/users/users.controller";

const app = async () => {
  console.log("ok");
  const db = await open({
    filename: "test-database.db",
    driver: sqlite3.Database
  });

  const usersController = new UsersController();

  await db.run(
    "CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)"
  );

  // const router: Middleware = new RouterMiddleware();
  // const json: Middleware = new JSONMiddleware();
  // const requestLogger: Middleware = new RequestLogger();
  // const cors: Middleware = new CorsMiddleware();

  // const middlewares: Set<Middleware> = new Set([cors, requestLogger, json]);

  // const router = new Router(routes);
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
      httpContext.request.url === "/users"
    ) {
      const response = await routes[1]!.handler(httpContext);
      httpContext.response.writeHead(200, {
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(
          Buffer.from(JSON.stringify(response))
        )
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

  return true;
};

app().then();
