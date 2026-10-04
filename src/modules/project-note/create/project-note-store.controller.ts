import type { CommandHandler } from "@scream.js/database/command-handler.js";
import {
	StoreController,
	type StoreFailure,
} from "@scream.js/http/controllers/store.controller.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import { ProjectNotFoundError } from "../project-not-found.error.js";
import {
	type ProjectNoteCreateData,
	type ProjectNoteStoreInput,
	projectNoteFormFieldsSchema,
	projectNoteStoreInputSchema,
} from "../project-note.schema.js";

export class ProjectNoteStoreController extends StoreController<
	ProjectNoteStoreInput,
	number
> {
	readonly #projects: CommandHandler<void, ProjectNoteCreateData["projects"]>;

	constructor(
		service: CommandHandler<ProjectNoteStoreInput, number>,
		projects: CommandHandler<void, ProjectNoteCreateData["projects"]>,
	) {
		super(service);
		this.#projects = projects;
	}

	protected inputSchema() {
		return projectNoteStoreInputSchema;
	}

	protected redirectUrl(id: number) {
		return `/project-notes/${id}`;
	}

	protected async validationFailed(
		ctx: HttpContext,
		error: z.ZodError<ProjectNoteStoreInput>,
	) {
		const fields = projectNoteFormFieldsSchema.parse(ctx.body());
		const errors = { body: "", projectId: "", title: "" };
		for (const issue of error.issues) {
			const key = issue.path[0];
			if (key === "title" || key === "body" || key === "projectId") {
				errors[key] ||= issue.message;
			}
		}
		const projects = await this.#projects.execute();

		return ctx.render("project-note/form", {
			action: "/project-notes",
			backUrl: "/project-notes",
			cannotSubmit: projects.length === 0,
			errors,
			fields,
			isEditing: false,
			noteId: 0,
			pageTitle: "Create Project Note",
			projectName: "",
			projects: projects.map((project) => ({
				...project,
				isSelected: project.id === Number(fields.projectId),
			})),
			submitLabel: "Create",
		});
	}

	protected persistenceFailed({
		ctx,
		error,
	}: StoreFailure<ProjectNoteStoreInput>) {
		if (error instanceof ProjectNotFoundError) {
			return ctx.notFound();
		}
		throw error;
	}
}
