import type { Knex } from "knex";
import { z } from "zod/v4";

import type { TodoRepository } from "./todo.repository.js";
import type {
	CreateTodoInput,
	TodoSchema,
	UpdateTodoInput,
} from "./todo.schema.js";

export class KnexTodoRepository implements TodoRepository {
	readonly #db: Knex;

	constructor(db: Knex) {
		this.#db = db;
	}

	async findById(id: TodoSchema["id"]) {
		const row = await this.#db("todos").where("id", id).first();

		if (!row) {
			return;
		}

		const validator = z
			.object({
				title: z.string().nonempty(),
				user_id: z.coerce.number(),
				id: z.coerce.number(),
			})
			.parse(row);

		return {
			id: validator.id,
			userId: validator.user_id,
			title: validator.title,
		} satisfies TodoSchema;
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
			userId: row.user_id,
			title: row.title,
		}));
	}

	async insert(input: CreateTodoInput) {
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

	async update(id: TodoSchema["id"], input: UpdateTodoInput) {
		await this.#db("todos").where({ id }).update({
			title: input.title,
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
