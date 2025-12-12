import type { Knex } from "knex";
import { z } from "zod/v4";
import type { CreateTodo, Todo, UpdateTodo } from "../core/todos/todo.js";
import type { TodoRepository } from "../core/todos/todo.repository.js";

export class KnexTodoRepository implements TodoRepository {
	readonly #db: Knex;

	constructor(db: Knex) {
		this.#db = db;
	}

	async findById(id: Todo["id"]) {
		const row = await this.#db("todos").where("id", id).first();

		if (!row) {
			return;
		}

		const validator = z
			.object({
				id: z.coerce.number(),
				title: z.string().nonempty(),
				user_id: z.coerce.number(),
			})
			.parse(row);

		return {
			id: validator.id,
			title: validator.title,
			userId: validator.user_id,
		};
	}

	async findAll() {
		const rows = await this.#db("todos").select();

		const validator = z
			.array(
				z.object({
					id: z.coerce.number(),
					title: z.string().nonempty(),
					user_id: z.coerce.number(),
				}),
			)
			.parse(rows);

		return validator.map((row) => ({
			id: row.id,
			title: row.title,
			userId: row.user_id,
		}));
	}

	async insert(input: CreateTodo) {
		const [id] = await this.#db("todos").insert({
			title: input.title,
			user_id: input.userId,
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

	async update(id: Todo["id"], input: UpdateTodo) {
		await this.#db("todos")
			.where({ id })
			.update({ title: input.title ?? "" });

		const todo = await this.findById(id);

		if (!todo) {
			throw new Error("Todo was updated but could not be found");
		}

		return todo;
	}

	async delete(id: Todo["id"]) {
		const affectedRows = await this.#db("todos").where("id", id).del();

		return affectedRows;
	}
}
