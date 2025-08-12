import type { Logger } from "@scream.js/logger/logger.interface.js";
import type { TodoRepository } from "./todo.repository.js";
import type { TodoSchema } from "./todo.schema.js";

export class TodoInMemoryCache implements TodoRepository {
	readonly #repository: TodoRepository;
	readonly #identityMap: Map<TodoSchema["id"], TodoSchema>;
	readonly #logger: Logger;

	constructor(
		repository: TodoRepository,
		identityMap: Map<TodoSchema["id"], TodoSchema>,
		logger: Logger,
	) {
		this.#repository = repository;
		this.#identityMap = identityMap;
		this.#logger = logger;
	}

	async findById(id: TodoSchema["id"]) {
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

	async insert(entity: TodoSchema) {
		return this.#repository.insert(entity);
	}

	async update(id: TodoSchema["id"], entity: TodoSchema) {
		const todo = await this.#repository.update(id, entity);

		if (todo) {
			this.#identityMap.delete(id);
		}

		return todo;
	}

	async delete(id: TodoSchema["id"]) {
		const deletedCount = await this.#repository.delete(id);

		if (deletedCount > 0) {
			this.#identityMap.delete(id);
		}

		return deletedCount;
	}
}
