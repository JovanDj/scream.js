import type { Knex } from "knex";
import { Tag } from "./tag.js";

export class TagService {
	readonly #db: Knex;

	constructor(db: Knex) {
		this.#db = db;
	}

	async findAll() {
		return Tag.findAll(this.#db);
	}

	async create(input: Readonly<{ name: string }>) {
		return Tag.create(this.#db, {
			name: input.name,
		});
	}

	async delete(id: number) {
		return Tag.deleteById(this.#db, id);
	}

	async replaceTodoTags(todoId: number, input: Readonly<{ tagIds: number[] }>) {
		return this.#db.transaction(async (tx) => {
			return Tag.replaceTodoTags(tx, {
				tagIds: input.tagIds,
				todoId,
			});
		});
	}

	async findTodoTagIds(todoId: number) {
		return Tag.findTodoTagIds(this.#db, todoId);
	}
}
