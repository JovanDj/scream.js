import type { Knex } from "knex";
import { z } from "zod/v4";

const todoRowSchema = z.object({
	completed: z.coerce.boolean(),
	id: z.coerce.number(),
	title: z.string().nonempty(),
	user_id: z.coerce.number(),
});

export class Todo {
	readonly #id: number;
	readonly #title: string;
	readonly #userId: number;
	readonly #completed: boolean;

	constructor(snapshot: {
		id: number;
		title: string;
		userId: number;
		completed: boolean;
	}) {
		this.#id = snapshot.id;
		this.#title = snapshot.title;
		this.#userId = snapshot.userId;
		this.#completed = snapshot.completed;
	}

	get id() {
		return this.#id;
	}

	get title() {
		return this.#title;
	}

	get userId() {
		return this.#userId;
	}

	get completed() {
		return this.#completed;
	}

	static async create(
		db: Knex | Knex.Transaction,
		input: Readonly<{ title: string; completed: boolean; userId: number }>,
	) {
		const [row] = await db("todos")
			.insert({
				completed: input.completed,
				title: input.title,
				user_id: input.userId,
			})
			.returning(["id", "title", "completed", "user_id"]);

		return Todo.#fromRow(row);
	}

	apply(input: Readonly<{ title: string; completed: boolean }>) {
		return new Todo({
			completed: input.completed,
			id: this.#id,
			title: input.title,
			userId: this.#userId,
		});
	}

	async save(db: Knex | Knex.Transaction) {
		const affectedRows = await db("todos")
			.where({ id: this.id, user_id: this.userId })
			.update({ completed: this.completed, title: this.title });

		if (affectedRows === 0) {
			throw new Error();
		}

		return this;
	}

	async remove(db: Knex | Knex.Transaction) {
		const affectedRows = await db("todos")
			.where({ id: this.id, user_id: this.userId })
			.del();

		return affectedRows > 0;
	}

	static async deleteById(db: Knex | Knex.Transaction, id: number) {
		const affectedRows = await db("todos").where({ id, user_id: 1 }).del();
		return affectedRows > 0;
	}

	static #fromRow(row: unknown) {
		const parsed = todoRowSchema.parse(row);

		return new Todo({
			completed: parsed.completed,
			id: parsed.id,
			title: parsed.title,
			userId: parsed.user_id,
		});
	}

	static async findById(
		db: Knex | Knex.Transaction,
		id: number,
	): Promise<Todo | undefined> {
		const row = await db("todos").where({ id, user_id: 1 }).first();

		if (!row) {
			return undefined;
		}

		return Todo.#fromRow(row);
	}

	static async findAll(db: Knex | Knex.Transaction) {
		const rows = await db("todos").where("user_id", 1).select();

		return rows.map((row) => Todo.#fromRow(row));
	}
}
