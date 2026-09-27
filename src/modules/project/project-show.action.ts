import type { Database } from "@scream.js/database/db.js";
import { ShowAction } from "../show.action.js";
import type { ProjectShowData, ProjectShowInput } from "./project.schema.js";
import {
	projectShowDataSchema,
	projectShowInputSchema,
} from "./project.schema.js";

export class ProjectShowAction extends ShowAction<
	ProjectShowInput,
	ProjectShowData
> {
	protected inputSchema() {
		return projectShowInputSchema;
	}

	protected async load(input: ProjectShowInput, db: Database) {
		return db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.where({ "projects.id": input.id })
			.select(
				"projects.id",
				"projects.name",
				db.ref("project_statuses.code").as("status_code"),
			)
			.first();
	}

	protected dataSchema() {
		return projectShowDataSchema;
	}

	protected present(project: ProjectShowData) {
		return { pageTitle: `Project | ${project.name}`, project };
	}

	protected template() {
		return "project-show";
	}
}
