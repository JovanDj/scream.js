import { SqliteDatabase } from "../../lib/database/sqlite.js";
import { TodoRepository } from "./todo.repository.js";
import { TodosController } from "./todos.controller.js";

const db = new SqliteDatabase("migration-test.sqlite");
const todoRepository = new TodoRepository(db);

export const todoController = new TodosController(todoRepository);
