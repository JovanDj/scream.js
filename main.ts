import { SqliteDatabase } from "./lib/database/sqlite.js";
import { createServer } from "./lib/http/create-server.js";
import { TodoRepository } from "./src/todos/todo.repository.js";
import { TodosController } from "./src/todos/todos.controller.js";

export const app = createServer();

app.get("/", (ctx) => {
  ctx.response.render("./index", {
    name: "Jovan",
    message: "Rendered with ejs",
  });
});

app.get("/todos", async (ctx) => {
  const db = new SqliteDatabase("migration-test.sqlite");
  const todoRepository = new TodoRepository(db);
  const todosController = new TodosController(todoRepository);

  const todos = await todosController.findAll(ctx);
  console.log(ctx.request);

  ctx.response.status(200);
  ctx.response.json({ todos });
});

app.get("/todos/:id", async (ctx) => {
  const db = new SqliteDatabase("migration-test.sqlite");
  const todoRepository = new TodoRepository(db);
  const todosController = new TodosController(todoRepository);

  const todo = await todosController.findOne(ctx);

  ctx.response.status(200);
  ctx.response.json({ todo });
});

app.post("/todos", async (ctx) => {
  const db = new SqliteDatabase("migration-test.sqlite");
  const todoRepository = new TodoRepository(db);
  const todosController = new TodosController(todoRepository);

  const result = await todosController.create();

  ctx.response.status(201);
  ctx.response.json({ result });
});

app.patch("/todos/:id", (ctx) => {
  ctx.response.status(200);
  ctx.response.end("UPDATE");
});
