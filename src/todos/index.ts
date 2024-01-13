import { db } from "../../config/database.js";
import { TodoIdentityMap } from "./todo.identity-map.js";
import { Todo } from "./todo.js";
import { TodoMapper } from "./todo.mapper.js";
import { TodoRepository } from "./todo.repository.js";
import { TodosController } from "./todos.controller.js";

const todoMapper = new TodoMapper();
const todoRepository = new TodoRepository(db, todoMapper);
const identityMap = new TodoIdentityMap(
  todoRepository,
  new Map<Todo["id"], Todo>(),
);
export const todoController = new TodosController(identityMap);
