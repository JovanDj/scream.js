import type { Knex } from "knex";
import { Todo } from "./todo.js";

export class TodoService {
	readonly #db: Knex;

	constructor(db: Knex) {
		this.#db = db;
	}

	async findAll() {
		return Todo.findAll(this.#db);
	}

	async findById(id: number) {
		return Todo.findById(this.#db, id);
	}

	async create(input: Readonly<{ title: string; completed: boolean }>) {
		return Todo.create(this.#db, {
			completed: input.completed,
			title: input.title,
			userId: 1,
		});
	}

	async update(
		id: number,
		input: Readonly<{ title: string; completed: boolean }>,
	) {
		return this.#db.transaction(async (tx) => {
			const todo = await Todo.findById(tx, id);

			if (!todo) {
				return undefined;
			}

			return todo.apply(input).save(tx);
		});
	}

	async delete(id: number) {
		return Todo.deleteById(this.#db, id);
	}
}
