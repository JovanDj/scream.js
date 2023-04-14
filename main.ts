import { createServer } from "node:http";

import { TodoController } from "./src/todos/todos.controller";
class UserController {
  findAll() {
    return "FIND ALL USERS";
  }
}

export const server = createServer((req, res) => {
  const { method = "GET", url = "/" } = req;
  const { pathname } = new URL(
    url,
    `http://${req.headers.host ?? "localhost"}`
  );

  if (pathname.match("/todos")) {
    const todosController = new TodoController();
    if (method === "GET") {
      if (url === "/todos") {
        return res.end(todosController.findAll());
      }
      if (url === "/todos/1") {
        return res.end(todosController.findOne());
      }
    }

    if (method === "POST") {
      if (url === "/todos") {
        return res.end(todosController.create());
      }
    }
  }

  if (pathname.match("/users")) {
    const usersController = new UserController();

    if (method === "GET") {
      if (url === "/users") {
        return res.end(usersController.findAll());
      }
    }
  }

  return res.writeHead(404, "NOT FOUND").end("NOT FOUND");
});
