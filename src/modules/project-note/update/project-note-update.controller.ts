import type { CommandHandler } from "@scream.js/database/command-handler.js";
import type { Controller } from "@scream.js/http/controller.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import {
	type ProjectNoteData,
	type ProjectNoteShowInput,
	type ProjectNoteUpdateInput,
	projectNoteFormFieldsSchema,
	projectNoteShowInputSchema,
	projectNoteUpdateInputSchema,
} from "../project-note.schema.js";

export class ProjectNoteUpdateController implements Controller {
	readonly #getNote: CommandHandler<
		ProjectNoteShowInput,
		ProjectNoteData | undefined
	>;
	readonly #updateNote: CommandHandler<
		ProjectNoteShowInput & ProjectNoteUpdateInput,
		{ id: number } | undefined
	>;

	constructor(
		updateNote: CommandHandler<
			ProjectNoteShowInput & ProjectNoteUpdateInput,
			{ id: number } | undefined
		>,
		getNote: CommandHandler<ProjectNoteShowInput, ProjectNoteData | undefined>,
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
			const errors: { body?: string; title?: string } = {};
			for (const issue of parsed.error.issues) {
				const key = issue.path[0];
				if (key === "title" || key === "body") {
					errors[key] ||= issue.message;
				}
			}
			return ctx.render("project-note/form", {
				action: `/project-notes/${note.id}`,
				backUrl: `/project-notes/${note.id}`,
				cannotSubmit: undefined,
				errors,
				fields: {
					...projectNoteFormFieldsSchema.parse(ctx.body()),
					projectId: String(note.projectId),
				},
				homeUrl: "/",
				isEditing: true,
				noteId: note.id,
				notesUrl: "/project-notes",
				projectName: note.projectName,
				projects: [],
				tagsUrl: "/tags",
				todosUrl: "/todos",
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
