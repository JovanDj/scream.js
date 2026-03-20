import type { DatabaseHandle } from "@scream.js/database/db.js";
import type { ProjectWriteInput } from "./project.js";
import { ProjectMapper } from "./project.mapper.js";

export class ProjectService {
	readonly #db: DatabaseHandle;

	constructor(db: DatabaseHandle) {
		this.#db = db;
	}

	async findAll(options?: { includeArchived?: boolean }) {
		return ProjectMapper.create(this.#db).findAll(options);
	}

	async findById(id: number) {
		return ProjectMapper.create(this.#db).findById(id);
	}

	async create(input: Readonly<ProjectWriteInput>) {
		return this.#db.transaction(async (tx) => {
			return ProjectMapper.create(tx).insert(input);
		});
	}

	async update(id: number, input: Readonly<ProjectWriteInput>) {
		return this.#db.transaction(async (tx) => {
			const mapper = ProjectMapper.create(tx);
			const project = await mapper.findById(id);
			if (!project) {
				return undefined;
			}

			return mapper.update(project.apply(input));
		});
	}

	async delete(id: number) {
		return ProjectMapper.create(this.#db).delete(id);
	}

	async archive(id: number) {
		return this.#db.transaction(async (tx) => {
			const mapper = ProjectMapper.create(tx);
			const project = await mapper.findById(id);
			if (!project) {
				return undefined;
			}

			return mapper.update(project.archive());
		});
	}

	async unarchive(id: number) {
		return this.#db.transaction(async (tx) => {
			const mapper = ProjectMapper.create(tx);
			const project = await mapper.findById(id);
			if (!project) {
				return undefined;
			}

			return mapper.update(project.unarchive());
		});
	}
}
