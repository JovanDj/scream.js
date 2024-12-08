import type { Repository } from "@scream.js/database/repository.js";

import { db } from "config/database.js";
import type { Todo } from "./todo.js";
import { TodoRepository } from "./todo.repository.js";
import { TodosController } from "./todos.controller.js";

const todoRepository: Repository<Todo> = new TodoRepository(db);

export const todoController = new TodosController(todoRepository);
