import type { DatabaseHandle } from "@scream.js/database/db.js";
import type { TagWriteInput } from "./tag.js";
import { TagMapper } from "./tag.mapper.js";

export class TagService {
	readonly #db: DatabaseHandle;

	constructor(db: DatabaseHandle) {
		this.#db = db;
	}

	async findAll() {
		return TagMapper.create(this.#db).findAll();
	}

	async create(input: Readonly<TagWriteInput>) {
		return this.#db.transaction(async (tx) => {
			return TagMapper.create(tx).insert(input);
		});
	}

	async delete(id: number) {
		return TagMapper.create(this.#db).delete(id);
	}

	async replaceTodoTags(todoId: number, input: Readonly<{ tagIds: number[] }>) {
		return this.#db.transaction(async (tx) => {
			return TagMapper.create(tx).replaceTodoTags(todoId, input);
		});
	}

	async findTodoTagIds(todoId: number) {
		return TagMapper.create(this.#db).findTodoTagIds(todoId);
	}
}
