import type { DataMapper } from "@scream.js/database/mapper.js";
import type { Repository } from "@scream.js/database/repository.js";
import type { Todo } from "./todo.js";
import type { TodoRow } from "./todo.row.js";

export class TodoRepository implements Repository<Todo, Pick<Todo, "title">> {
	readonly #mapper: DataMapper<Todo, TodoRow>;

	constructor(mapper: DataMapper<Todo, TodoRow>) {
		this.#mapper = mapper;
	}

	async findById(id: Todo["id"]) {
		return this.#mapper.findById(id);
	}

	async findAll() {
		return this.#mapper.findAll();
	}

	async insert(entity: Pick<Todo, "title">) {
		return this.#mapper.insert(entity);
	}

	async update(id: Todo["id"], entity: Partial<Todo>) {
		return this.#mapper.update(id, entity);
	}

	async delete(id: Todo["id"]) {
		return this.#mapper.delete(id);
	}
}
