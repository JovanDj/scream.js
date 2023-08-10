import { SqliteDatabase } from "../../lib/database/sqlite.js";
import { TodoRepository } from "./todo.repository.js";
import { TodosController } from "./todos.controller.js";

export const todoController = new TodosController(
  new TodoRepository(new SqliteDatabase("migration-test.sqlite"))
);
