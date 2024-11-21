import type { Repository } from "@scream.js/database/repository.js";
import type { TodoRow } from "knex/types/tables.js";
import type { Database, Statement } from "sqlite";
import { Todo } from "./todo.js";

export class TodoRepository implements Repository<Todo>, AsyncDisposable {
	readonly #findTodoById: Statement;
	readonly #findAllTodos: Statement;
	readonly #insertTodo: Statement;
	readonly #updateTodo: Statement;
	readonly #deleteTodo: Statement;

	readonly #db: Database;

	constructor(
		db: Database,
		findTodoById: Statement,
		findAllTodos: Statement,
		insertTodo: Statement,
		updateTodo: Statement,
		deleteTodo: Statement,
	) {
		this.#db = db;
		this.#findTodoById = findTodoById;
		this.#findAllTodos = findAllTodos;
		this.#insertTodo = insertTodo;
		this.#updateTodo = updateTodo;
		this.#deleteTodo = deleteTodo;
	}

	async findById(id: Todo["id"]) {
		try {
			await this.#db.exec("BEGIN DEFERRED TRANSACTION");

			const row = await this.#findTodoById.get<TodoRow>([id]);

			await this.#db.exec("COMMIT");

			if (!row) {
				return undefined;
			}

			return new Todo(row.id, row.user_id, row.title);
		} catch (error) {
			await this.#db.exec("ROLLBACK");
			throw error;
		}
	}

	async findAll() {
		const rows = await this.#findAllTodos.all<TodoRow[]>();

		return rows.map((row) => new Todo(row.id, row.user_id, row.title));
	}

	async insert(entity: Partial<Todo>) {
		try {
			await this.#db.exec("BEGIN IMMEDIATE TRANSACTION");
			const result = await this.#insertTodo.run([entity.title, entity.userId]);

			if (!result.lastID) {
				throw new Error("Could not insert a todo");
			}

			const todo = await this.#findTodoById.get<TodoRow>(result.lastID);

			if (!todo) {
				throw new Error("Todo was inserted but could not be found");
			}

			await this.#db.exec("COMMIT");

			return new Todo(todo.id, todo.user_id, todo.title);
		} catch (error) {
			await this.#db.exec("ROLLBACK");
			throw error;
		}
	}

	async update(id: Todo["id"], entity: Partial<Todo>) {
		try {
			await this.#db.exec("BEGIN IMMEDIATE TRANSACTION");
			const result = await this.#updateTodo.run([entity.title, id]);

			if (!result.changes) {
				throw new Error("Could not update a todo");
			}

			const todo = await this.#findTodoById.get<TodoRow>(id);

			if (!todo) {
				throw new Error("Todo was updated but could not be found");
			}

			await this.#db.exec("COMMIT");

			return new Todo(todo.id, todo.user_id, todo.title);
		} catch (error) {
			await this.#db.exec("ROLLBACK");
			throw error;
		}
	}

	async delete(id: Todo["id"]) {
		try {
			await this.#db.exec("BEGIN IMMEDIATE TRANSACTION");

			const result = await this.#deleteTodo.run([id]);

			if (!result.changes) {
				throw new Error("Could not delete a todo");
			}

			await this.#db.exec("COMMIT");

			return result.changes;
		} catch (error) {
			await this.#db.exec("ROLLBACK");
			throw error;
		}
	}

	async [Symbol.asyncDispose]() {
		await this.#findTodoById.finalize();
		await this.#findAllTodos.finalize();
		await this.#insertTodo.finalize();
		await this.#updateTodo.finalize();
		await this.#deleteTodo.finalize();
	}
}
