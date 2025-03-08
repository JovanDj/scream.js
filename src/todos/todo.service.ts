import type { Entity } from "@scream.js/database/entity.js";
import type { Repository } from "@scream.js/database/repository.js";
import type { Todo } from "./todo.js";

export class TodoService {
	readonly #todoRepository: Repository<Todo>;

	constructor(todoRepository: Repository<Todo>) {
		this.#todoRepository = todoRepository;
	}

	async findAll() {
		return this.#todoRepository.findAll();
	}

	async findById(id: number) {
		return this.#todoRepository.findById(id);
	}

	async create(entity: Partial<Todo>) {
		return this.#todoRepository.insert(entity);
	}

	async update(id: number, entity: Partial<Entity>) {
		return this.#todoRepository.update(id, entity);
	}

	async delete(id: number) {
		return this.#todoRepository.delete(id);
	}
}
