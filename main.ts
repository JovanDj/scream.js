import express from "express";
import { ConnectionFactory } from "./lib/database/connection-factory";
import { Todo } from "./src/todos/todo";
import { TodosController } from "./src/todos/todos.controller";

export const app = async () => {
  const app = express();
  app.use(express.json());

  const db = await ConnectionFactory.createConnection();

  await db.run(
    "CREATE TABLE todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)"
  );

  await db.run("INSERT INTO todos (title) VALUES (?)", "test1");

  const todo = new Todo(db);
  const todosController = new TodosController(todo);

  app.get("/todos", async (_req, res) => {
    res.json(await todosController.findAll());
  });

  app.get("/todos/:id", async (req, res) => {
    console.log();
    res.json(await todosController.findOne(+req.params.id));
  });

  return app;
};
