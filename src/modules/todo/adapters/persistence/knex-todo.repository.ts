import type { Knex } from "knex";
import { z } from "zod/v4";
import type { TodoRepository } from "../../application/todo.repository.js";
import type { Todo, TodoDto } from "../../domain/todo.js";

export class KnexTodoRepository implements TodoRepository {
	readonly #db: Knex;
	readonly #userId = 1;

	constructor(db: Knex) {
		this.#db = db;
	}

	async findById(id: Todo["id"]) {
		const row = await this.#db("todos")
			.where({ id, user_id: this.#userId })
			.first();

		if (!row) {
			return;
		}

		const validator = z
			.object({
				completed: z.coerce.boolean(),
				id: z.coerce.number(),
				title: z.string().nonempty(),
				user_id: z.coerce.number(),
			})
			.parse(row);

		return {
			completed: validator.completed,
			id: validator.id,
			title: validator.title,
			userId: validator.user_id,
		};
	}

	async findAll() {
		const rows = await this.#db("todos")
			.where("user_id", this.#userId)
			.select();

		const validator = z
			.array(
				z.object({
					completed: z.coerce.boolean(),
					id: z.coerce.number(),
					title: z.string().nonempty(),
					user_id: z.coerce.number(),
				}),
			)
			.parse(rows);

		return validator.map((row) => ({
			completed: row.completed,
			id: row.id,
			title: row.title,
			userId: row.user_id,
		}));
	}

	async insert(input: TodoDto) {
		const [id] = await this.#db("todos").insert({
			completed: input.completed ?? false,
			title: input.title,
			user_id: this.#userId,
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

	async update(id: Todo["id"], input: TodoDto) {
		const affectedRows = await this.#db("todos")
			.where({ id, user_id: this.#userId })
			.update({ completed: input.completed, title: input.title });

		if (!affectedRows) {
			throw new Error("Todo was updated but could not be found");
		}

		const todo = await this.findById(id);

		if (!todo) {
			throw new Error("Todo was updated but could not be found");
		}

		return todo;
	}

	async delete(id: Todo["id"]) {
		const affectedRows = await this.#db("todos")
			.where({ id, user_id: this.#userId })
			.del();

		return affectedRows;
	}
}
