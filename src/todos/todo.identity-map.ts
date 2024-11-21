import type { Repository } from "@scream.js/database/repository.js";
import type { Logger } from "@scream.js/logger/logger.interface.js";
import type { Todo } from "./todo.js";

export class TodoIdentityMap implements Repository<Todo> {
	readonly #repository: Repository<Todo>;
	readonly #identityMap: Map<Todo["id"], Todo>;
	readonly #logger: Logger;

	constructor(
		repository: Repository<Todo>,
		identityMap: Map<Todo["id"], Todo>,
		logger: Logger,
	) {
		this.#repository = repository;
		this.#identityMap = identityMap;
		this.#logger = logger;
	}

	async findById(id: Todo["id"]) {
		if (!this.#identityMap.has(id)) {
			this.#logger.log("cache miss");

			const todo = await this.#repository.findById(id);

			if (!todo) {
				return;
			}

			this.#identityMap.set(todo.id, todo);

			return todo;
		}
		this.#logger.log("cache hit");

		return this.#identityMap.get(id);
	}

	async findAll() {
		return this.#repository.findAll();
	}

	async insert(entity: Todo) {
		return this.#repository.insert(entity);
	}

	async update(id: Todo["id"], entity: Todo) {
		const todo = await this.#repository.update(id, entity);

		if (todo) {
			this.#identityMap.delete(id);
		}

		return todo;
	}

	async delete(id: Todo["id"]) {
		const deletedCount = await this.#repository.delete(id);

		if (deletedCount > 0) {
			this.#identityMap.delete(id);
		}

		return deletedCount;
	}
}
