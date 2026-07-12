import { ShowController } from "@scream.js/http/controllers/show.controller.js";
import {
	type ProjectNoteData,
	type ProjectNoteShowInput,
	projectNoteShowInputSchema,
} from "./project-note.schema.js";

export class ProjectNoteShowController extends ShowController<
	ProjectNoteShowInput,
	ProjectNoteData
> {
	protected inputSchema() {
		return projectNoteShowInputSchema;
	}

	protected present(note: ProjectNoteData) {
		return {
			action: `/project-notes/${note.id}`,
			backUrl: `/project-notes?projectId=${note.projectId}`,
			editUrl: `/project-notes/${note.id}/edit`,
			homeUrl: "/",
			note,
			notesUrl: "/project-notes",
			projectUrl: `/projects/${note.projectId}`,
			tagsUrl: "/tags",
			todosUrl: "/todos",
		};
	}

	protected template() {
		return "project-note/show";
	}
}
