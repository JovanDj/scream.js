import type { ProjectWriteInput } from "./project.js";

export interface ProjectRepository {
	delete(id: number): Promise<boolean>;
	findAll(
		options?: Readonly<{ includeArchived?: boolean }>,
	): Promise<import("./project.js").Project[]>;
	findById(id: number): Promise<import("./project.js").Project | undefined>;
	insert(
		input: Readonly<ProjectWriteInput>,
	): Promise<import("./project.js").Project>;
	save(
		project: import("./project.js").Project,
	): Promise<import("./project.js").Project | undefined>;
	transaction<T>(
		callback: (repository: ProjectRepository) => Promise<T>,
	): Promise<T>;
}

export class ProjectService {
	readonly #repository: ProjectRepository;

	constructor(repository: ProjectRepository) {
		this.#repository = repository;
	}

	async findAll(options?: { includeArchived?: boolean }) {
		return this.#repository.findAll(options);
	}

	async findById(id: number) {
		return this.#repository.findById(id);
	}

	async create(input: Readonly<ProjectWriteInput>) {
		return this.#repository.insert(input);
	}

	async update(id: number, input: Readonly<ProjectWriteInput>) {
		return this.#repository.transaction(async (repository) => {
			const project = await repository.findById(id);
			if (!project) {
				return undefined;
			}

			return repository.save(project.apply(input));
		});
	}

	async delete(id: number) {
		return this.#repository.delete(id);
	}

	async archive(id: number) {
		return this.#repository.transaction(async (repository) => {
			const project = await repository.findById(id);
			if (!project) {
				return undefined;
			}

			return repository.save(project.archive());
		});
	}

	async unarchive(id: number) {
		return this.#repository.transaction(async (repository) => {
			const project = await repository.findById(id);
			if (!project) {
				return undefined;
			}

			return repository.save(project.unarchive());
		});
	}
}
