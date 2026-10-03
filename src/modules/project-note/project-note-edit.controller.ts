import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Controller } from "../controller.js";
import type { GetProjectNoteService } from "./get-project-note.service.js";
import { projectNoteShowInputSchema } from "./project-note.schema.js";

export class ProjectNoteEditController implements Controller {
	readonly #getNote: GetProjectNoteService;

	constructor(getNote: GetProjectNoteService) {
		this.#getNote = getNote;
	}

	async handle(ctx: HttpContext) {
		const parsed = projectNoteShowInputSchema.safeParse({
			id: ctx.param("id"),
		});
		if (!parsed.success) {
			return ctx.notFound();
		}
		const note = await this.#getNote.execute(parsed.data);
		if (note === undefined) {
			return ctx.notFound();
		}
		return ctx.render("project-note-form", {
			action: `/project-notes/${note.id}`,
			backUrl: `/project-notes/${note.id}`,
			cannotSubmit: false,
			errors: { body: "", projectId: "", title: "" },
			fields: {
				body: note.body,
				projectId: String(note.projectId),
				title: note.title,
			},
			isEditing: true,
			noteId: note.id,
			pageTitle: "Edit Project Note",
			projectName: note.projectName,
			projects: [],
			submitLabel: "Update",
		});
	}
}
