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
			cannotSubmit: undefined,
			errors: {},
			fields: {
				body: note.body,
				projectId: String(note.projectId),
				title: note.title,
			},
			homeUrl: "/",
			isEditing: true,
			noteId: note.id,
			notesUrl: "/project-notes",
			projectName: note.projectName,
			projects: [],
			tagsUrl: "/tags",
			todosUrl: "/todos",
		};
	}

	protected template() {
		return "project-note/form";
	}
}
