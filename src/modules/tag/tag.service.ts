import type { Tag, TagWriteInput } from "./tag.js";

export interface TagRepository {
	delete(id: number): Promise<boolean>;
	findAll(): Promise<Tag[]>;
	findTodoTagIds(todoId: number): Promise<number[] | undefined>;
	insert(input: Readonly<TagWriteInput>): Promise<Tag>;
	replaceTodoTags(
		todoId: number,
		input: Readonly<{ tagIds: number[] }>,
	): Promise<boolean>;
	transaction<T>(
		callback: (repository: TagRepository) => Promise<T>,
	): Promise<T>;
}

export class TagService {
	readonly #repository: TagRepository;

	constructor(repository: TagRepository) {
		this.#repository = repository;
	}

	async findAll() {
		return this.#repository.findAll();
	}

	async create(input: Readonly<TagWriteInput>) {
		return this.#repository.insert(input);
	}

	async delete(id: number) {
		return this.#repository.delete(id);
	}

	async replaceTodoTags(todoId: number, input: Readonly<{ tagIds: number[] }>) {
		return this.#repository.transaction(async (repository) => {
			return repository.replaceTodoTags(todoId, input);
		});
	}

	async findTodoTagIds(todoId: number) {
		return this.#repository.findTodoTagIds(todoId);
	}
}
