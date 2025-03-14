import type { Repository } from "@scream.js/database/repository.js";
import type { Knex } from "knex";
import type { TodoRow } from "knex/types/tables.js";
import type {
	CreateTodoInput,
	TodoSchema,
	UpdateTodoInput,
} from "./todo.schema.js";

export class TodoRepository implements Repository<TodoSchema> {
	readonly #db: Knex;

	constructor(db: Knex) {
		this.#db = db;
	}

	async findById(id: TodoSchema["id"]) {
		const row = await this.#db<TodoRow>("todos").where("id", id).first();

		if (!row) {
			return undefined;
		}

		return { id: row.id, userId: row.user_id, title: row.title };
	}

	async findAll() {
		const rows = await this.#db<TodoRow>("todos").select();

		return rows.map((row) => ({
			id: row.id,
			userId: row.user_id,
			title: row.title,
		}));
	}

	async insert(input: CreateTodoInput) {
		const [id] = await this.#db<TodoRow>("todos").insert({
			title: input.title ?? "",
			user_id: input.userId ?? 1,
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

	async update(id: TodoSchema["id"], input: UpdateTodoInput) {
		await this.#db("todos")
			.where({ id })
			.update({
				title: input.title ?? "",
			});

		const todo = await this.findById(id);

		if (!todo) {
			throw new Error("Todo was updated but could not be found");
		}

		return todo;
	}

	async delete(id: TodoSchema["id"]) {
		const affectedRows = await this.#db("todos").where("id", id).del();

		return affectedRows;
	}
}
