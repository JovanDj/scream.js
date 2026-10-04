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
		return { note, pageTitle: note.title };
	}

	protected template() {
		return "project-note-show";
	}
}
