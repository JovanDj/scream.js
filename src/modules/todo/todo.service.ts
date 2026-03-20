import type {
	Todo,
	TodoFindAllOptions,
	TodoUpdateInput,
	TodoWriteInput,
} from "./todo.js";

export interface TodoRepository {
	delete(id: number): Promise<boolean>;
	findAll(options?: Readonly<TodoFindAllOptions>): Promise<Todo[]>;
	findById(id: number): Promise<Todo | undefined>;
	insert(input: Readonly<TodoWriteInput>): Promise<Todo>;
	save(todo: Todo): Promise<Todo | undefined>;
	transaction<T>(
		callback: (repository: TodoRepository) => Promise<T>,
	): Promise<T>;
}

export class TodoService {
	readonly #repository: TodoRepository;

	constructor(repository: TodoRepository) {
		this.#repository = repository;
	}

	async findAll(options?: Readonly<TodoFindAllOptions>) {
		return this.#repository.findAll(options);
	}

	async findById(id: number) {
		return this.#repository.findById(id);
	}

	async create(input: Readonly<TodoWriteInput>) {
		return this.#repository.transaction(async (repository) => {
			return repository.insert(input);
		});
	}

	async update(id: number, input: Readonly<TodoUpdateInput>) {
		return this.#repository.transaction(async (repository) => {
			const todo = await repository.findById(id);
			if (!todo) {
				return;
			}

			return repository.save(todo.apply(input));
		});
	}

	async toggle(id: number) {
		return this.#repository.transaction(async (repository) => {
			const todo = await repository.findById(id);
			if (!todo) {
				return;
			}

			return repository.save(todo.toggle());
		});
	}

	async delete(id: number) {
		return this.#repository.delete(id);
	}
}
