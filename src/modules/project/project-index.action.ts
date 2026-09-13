import type { Database } from "@scream.js/database/db.js";
import { IndexAction } from "../index.action.js";
import type { ProjectIndexData, ProjectIndexInput } from "./project.schema.js";
import {
	projectIndexDataSchema,
	projectIndexInputSchema,
} from "./project.schema.js";

export class ProjectIndexAction extends IndexAction<
	ProjectIndexInput,
	ProjectIndexData
> {
	protected inputSchema() {
		return projectIndexInputSchema;
	}

	protected async load(input: ProjectIndexInput, db: Database) {
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

		return query.orderBy("projects.id", "desc");
	}

	protected dataSchema() {
		return projectIndexDataSchema;
	}

	protected present(projects: ProjectIndexData, input: ProjectIndexInput) {
		const createFilterUrl = (status: ProjectIndexInput["status"]) => {
			const params = new URLSearchParams();
			if (status !== "all") {
				params.set("status", status);
			}
			if (input.search.length > 0) {
				params.set("search", input.search);
			}

			const query = params.toString();
			return query.length > 0 ? `/projects?${query}` : "/projects";
		};

		return {
			filters: {
				active: createFilterUrl("active"),
				all: createFilterUrl("all"),
				archived: createFilterUrl("archived"),
			},
			pageTitle: "Projects",
			projects,
			search: input.search,
			status: input.status,
		};
	}

	protected template() {
		return "project-index";
	}
}
