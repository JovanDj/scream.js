import type { Repository } from "@scream.js/database/repository.js";
import type { Knex } from "knex";
import type { TodoRow } from "knex/types/tables.js";
import { Todo } from "./todo.js";

export class TodoRepository implements Repository<Todo> {
	readonly #db: Knex;

	constructor(db: Knex) {
		this.#db = db;
	}

	async findById(id: Todo["id"]) {
		const row = await this.#db<TodoRow>("todos").where("id", id).first();

		if (!row) {
			return undefined;
		}

		return new Todo(row.id, row.user_id, row.title);
	}

	async findAll() {
		const rows = await this.#db<TodoRow>("todos").select();

		return rows.map((row) => new Todo(row.id, row.user_id, row.title));
	}

	async insert(entity: Partial<Todo>) {
		const [id] = await this.#db<TodoRow>("todos").insert({
			title: entity.title ?? "",
			user_id: entity.userId ?? 1,
		});

		if (!id) {
			throw new Error("Could not insert a todo");
		}

		const todo = await this.findById(id);

		if (!todo) {
			throw new Error("Todo was inserted but could not be found");
		}

		return todo;
	}

	async update(id: Todo["id"], entity: Partial<Todo>) {
		await this.#db("todos")
			.where({ id })
			.update({
				title: entity.title ?? "",
			});

		const todo = await this.findById(id);

		if (!todo) {
			throw new Error("Todo was updated but could not be found");
		}

		return todo;
	}

	async delete(id: Todo["id"]) {
		const affectedRows = await this.#db("todos").where("id", id).del();

		if (affectedRows === 0) {
			throw new Error("Could not delete a todo");
		}

		return affectedRows;
	}
}
