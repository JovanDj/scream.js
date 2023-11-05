import { db } from "../../config/database.js";
import { TodoMapper } from "./todo.mapper.js";
import { TodoRepository } from "./todo.repository.js";
import { TodosController } from "./todos.controller.js";

const todoMapper = new TodoMapper();
const todoRepository = new TodoRepository(db, todoMapper);
export const todoController = new TodosController(todoRepository);
