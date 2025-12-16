import type { Todo, TodoDto } from "./todo.js";
import type { TodoRepository } from "./todo.repository.js";

export class TodoService {
	readonly #todoRepository: TodoRepository;

	constructor(todoRepository: TodoRepository) {
		this.#todoRepository = todoRepository;
	}

	async findAll() {
		return this.#todoRepository.findAll();
	}

	async findById(id: Todo["id"]) {
		return this.#todoRepository.findById(id);
	}

	async create(input: TodoDto) {
		return this.#todoRepository.insert(input);
	}

	async update(id: Todo["id"], input: TodoDto) {
		return this.#todoRepository.update(id, input);
	}

	async delete(id: Todo["id"]) {
		return this.#todoRepository.delete(id);
	}
}
