import { db } from "../../config/database.js";
import { TodoRepository } from "./todo.repository.js";
import { TodosController } from "./todos.controller.js";

const todoRepository = new TodoRepository(db);
export const todoController = new TodosController(todoRepository);
