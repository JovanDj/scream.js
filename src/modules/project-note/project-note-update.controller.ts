import type { CommandHandler } from "@scream.js/database/command-handler.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Controller } from "../controller.js";
import type { GetProjectNoteService } from "./get-project-note.service.js";
import {
	type ProjectNoteShowInput,
	type ProjectNoteUpdateInput,
	projectNoteFormFieldsSchema,
	projectNoteShowInputSchema,
	projectNoteUpdateInputSchema,
} from "./project-note.schema.js";

export class ProjectNoteUpdateController implements Controller {
	readonly #getNote: GetProjectNoteService;
	readonly #updateNote: CommandHandler<
		ProjectNoteShowInput & ProjectNoteUpdateInput,
		{ id: number } | undefined
	>;

	constructor(
		updateNote: CommandHandler<
			ProjectNoteShowInput & ProjectNoteUpdateInput,
			{ id: number } | undefined
		>,
		getNote: GetProjectNoteService,
	) {
		this.#getNote = getNote;
		this.#updateNote = updateNote;
	}

	async handle(ctx: HttpContext) {
		const parsedId = projectNoteShowInputSchema.safeParse({
			id: ctx.param("id"),
		});
		if (!parsedId.success) {
			return ctx.notFound();
		}
		const note = await this.#getNote.execute(parsedId.data);
		if (note === undefined) {
			return ctx.notFound();
		}

		const parsed = projectNoteUpdateInputSchema.safeParse(ctx.body());
		if (!parsed.success) {
			const errors = { body: "", projectId: "", title: "" };
			for (const issue of parsed.error.issues) {
				const key = issue.path[0];
				if (key === "title" || key === "body") {
					errors[key] ||= issue.message;
				}
			}
			return ctx.render("project-note-form", {
				action: `/project-notes/${note.id}`,
				backUrl: `/project-notes/${note.id}`,
				cannotSubmit: false,
				errors,
				fields: {
					...projectNoteFormFieldsSchema.parse(ctx.body()),
					projectId: String(note.projectId),
				},
				isEditing: true,
				noteId: note.id,
				pageTitle: "Edit Project Note",
				projectName: note.projectName,
				projects: [],
				submitLabel: "Update",
			});
		}

		const result = await this.#updateNote.execute({
			...parsed.data,
			id: note.id,
		});
		if (result === undefined) {
			return ctx.notFound();
		}
		return ctx.redirect(`/project-notes/${result.id}`);
	}
}
