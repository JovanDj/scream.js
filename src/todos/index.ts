import { SqlQueryVisitor } from "@scream.js/database/query-builder/query-builder-visitor.js";
import { SqlQueryBuilder } from "@scream.js/database/query-builder/scream-query-builder.js";
import { db } from "../../config/database.js";
import { TodoMapper } from "./todo.mapper.js";
import { TodoRepository } from "./todo.repository.js";
import { TodosController } from "./todos.controller.js";

const todoMapper = new TodoMapper();
const queryBuilder = new SqlQueryBuilder(new SqlQueryVisitor());
const todoRepository = new TodoRepository(db, todoMapper, queryBuilder);
export const todoController = new TodosController(todoRepository);
