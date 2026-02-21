import type { Knex } from "knex";
import { Project } from "./project.js";

export class ProjectService {
	readonly #db: Knex;

	constructor(db: Knex) {
		this.#db = db;
	}

	async findAll(options?: { includeArchived?: boolean }) {
		return Project.findAll(this.#db, options);
	}

	async findById(id: number) {
		return Project.findById(this.#db, id);
	}

	async create(input: Readonly<{ name: string }>) {
		return Project.create(this.#db, { name: input.name });
	}

	async update(id: number, input: Readonly<{ name: string }>) {
		return this.#db.transaction(async (tx) => {
			const project = await Project.findById(tx, id);
			if (!project) {
				return undefined;
			}

			return project.apply(input).save(tx);
		});
	}

	async delete(id: number) {
		return Project.deleteById(this.#db, id);
	}

	async archive(id: number) {
		return this.#db.transaction(async (tx) => {
			const project = await Project.findById(tx, id);
			if (!project) {
				return undefined;
			}

			return project.setStatus("archived").save(tx);
		});
	}

	async unarchive(id: number) {
		return this.#db.transaction(async (tx) => {
			const project = await Project.findById(tx, id);
			if (!project) {
				return undefined;
			}

			return project.setStatus("active").save(tx);
		});
	}
}
