import { EditController } from "@scream.js/http/controllers/edit.controller.js";
import {
	type ProjectNoteData,
	type ProjectNoteShowInput,
	projectNoteShowInputSchema,
} from "../project-note.schema.js";

export class ProjectNoteEditController extends EditController<
	ProjectNoteShowInput,
	ProjectNoteData
> {
	protected inputSchema() {
		return projectNoteShowInputSchema;
	}

	protected present(note: ProjectNoteData) {
		return {
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
		};
	}

	protected template() {
		return "project-note/form";
	}
}
