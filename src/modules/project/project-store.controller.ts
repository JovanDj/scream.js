import {
	StoreController,
	type StoreFailure,
} from "@scream.js/http/controllers/store.controller.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import {
	type ProjectStoreInput,
	projectStoreInputSchema,
} from "./project.schema.js";

export class ProjectStoreController extends StoreController<
	ProjectStoreInput,
	number
> {
	protected inputSchema() {
		return projectStoreInputSchema;
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
