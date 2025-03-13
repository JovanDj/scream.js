import type { Repository } from "@scream.js/database/repository.js";
import type {
	CreateTodoInput,
	TodoSchema,
	UpdateTodoInput,
} from "./todo.schema.js";

export class TodoService {
	readonly #todoRepository: Repository<TodoSchema>;

	constructor(todoRepository: Repository<TodoSchema>) {
		this.#todoRepository = todoRepository;
	}

	async findAll() {
		return this.#todoRepository.findAll();
	}

	async findById(id: TodoSchema["id"]) {
		return this.#todoRepository.findById(id);
	}

	async create(input: CreateTodoInput) {
		return this.#todoRepository.insert(input);
	}

	async update(id: TodoSchema["id"], input: UpdateTodoInput) {
		return this.#todoRepository.update(id, input);
	}

	async delete(id: TodoSchema["id"]) {
		return this.#todoRepository.delete(id);
	}
}
