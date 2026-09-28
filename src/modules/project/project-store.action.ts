import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import { schema } from "@scream.js/validator/schema.js";
import type { z } from "zod/v4";
import { StoreAction, type StoreFailure } from "../store.action.js";
import {
	type ProjectStoreInput,
	projectStoreInputSchema,
} from "./project.schema.js";

export class ProjectStoreAction extends StoreAction<ProjectStoreInput, number> {
	protected inputSchema() {
		return projectStoreInputSchema;
	}

	protected async persist(input: ProjectStoreInput, db: Database) {
		const projectStatusRow = await db("project_statuses")
			.where({ code: "active" })
			.first("id");
		const projectStatus = schema
			.object({ id: schema.coerce.number().positive() })
			.parse(projectStatusRow);
		const now = new Date().toISOString();
		const [row] = await db("projects")
			.insert({
				created_at: now,
				name: input.name,
				status_id: projectStatus.id,
				updated_at: now,
			})
			.returning(["id"]);
		return row.id;
	}

	protected redirectUrl(id: number) {
		return `/projects/${id}`;
	}

	protected validationFailed(
		ctx: HttpContext,
		error: z.ZodError<ProjectStoreInput>,
	) {
		const errors = { name: "" };
		for (const issue of error.issues) {
			if (issue.path.join(".") === "name") {
				errors.name ||= issue.message;
			}
		}
		return ctx.render("project-create", {
			errors,
			fields: { name: "" },
			pageTitle: "Create Project",
		});
	}

	protected persistenceFailed({
		ctx,
		error,
		input,
	}: StoreFailure<ProjectStoreInput>) {
		if (
			!(error instanceof Error) ||
			!("code" in error) ||
			error.code !== "SQLITE_CONSTRAINT_UNIQUE" ||
			!error.message.endsWith("UNIQUE constraint failed: projects.name")
		) {
			throw error;
		}

		return ctx.render("project-create", {
			errors: { name: "Project name must be unique" },
			fields: { name: input.name },
			pageTitle: "Create Project",
		});
	}
}
