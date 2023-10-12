import { db } from "../../config/database.js";
import { TodoIdentityMap } from "./todo.identity-map.js";
import { Todo } from "./todo.js";
import { TodoRepository } from "./todo.repository.js";
import { TodosController } from "./todos.controller.js";

const todoRepository = new TodoRepository(db);
const identityMap = new Map<Todo["id"], Todo>();
const todoIdentityMap = new TodoIdentityMap(todoRepository, identityMap);
export const todoController = new TodosController(todoIdentityMap);
