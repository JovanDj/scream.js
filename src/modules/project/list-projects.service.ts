import type { Database } from "@scream.js/database/db.js";
import {
	type ProjectIndexInput,
	projectIndexDataSchema,
} from "./project.schema.js";

export class ListProjectsService {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute(
		input: ProjectIndexInput & {
			readonly limit: number;
			readonly offset: number;
		},
	) {
		const db = this.#db;
		const query = db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.select(
				"projects.id",
				"projects.name",
				db.ref("project_statuses.code").as("status_code"),
			);

		if (input.search.length > 0) {
			query.andWhereLike("projects.name", `%${input.search}%`);
		}
		if (input.status !== "all") {
			query.where({ "project_statuses.code": input.status });
		}

		query.orderBy(this.#sortColumn(input.sort), input.direction);
		if (input.sort !== "created") {
			query.orderBy("projects.id", "desc");
		}

		const rows = await query.limit(input.limit).offset(input.offset);
		return projectIndexDataSchema.parse(rows);
	}

	#sortColumn(sort: ProjectIndexInput["sort"]) {
		switch (sort) {
			case "created":
				return "projects.id";
			case "name":
				return "projects.name";
			case "status":
				return "project_statuses.code";
		}
	}
}
