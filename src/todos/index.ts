import type { Repository } from "@scream.js/database/repository.js";

import { open } from "sqlite";
import sqlite3 from "sqlite3";

import type { Todo } from "./todo.js";
import { TodoRepository } from "./todo.repository.js";
import { TodosController } from "./todos.controller.js";

const db = await open({ driver: sqlite3.Database, filename: "db.sqlite" });

const findTodoById = await db.prepare("SELECT * FROM todos WHERE id = ?;");
const findAllTodos = await db.prepare("SELECT * FROM todos;");
const insertTodo = await db.prepare(
	"INSERT INTO todos(title, user_id) VALUES (?, ?);",
);
const updateTodo = await db.prepare("UPDATE todos SET title = ? WHERE id = ?;");
const deleteTodo = await db.prepare("DELETE FROM todos WHERE id = ?");

const todoRepository: Repository<Todo> = new TodoRepository(
	db,
	findTodoById,
	findAllTodos,
	insertTodo,
	updateTodo,
	deleteTodo,
);

export const todoController = new TodosController(todoRepository);
