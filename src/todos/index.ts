import type { Repository } from "@scream.js/database/repository.js";

import { db } from "config/database.js";
import type { Todo } from "./todo.js";
import { TodoRepository } from "./todo.repository.js";
import { TodoService } from "./todo.service.js";
import { TodosController } from "./todos.controller.js";

const todoRepository: Repository<Todo> = new TodoRepository(db);
const todoService = new TodoService(todoRepository);
export const todoController = new TodosController(todoService);
