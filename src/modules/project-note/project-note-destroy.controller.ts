import { DestroyController } from "@scream.js/http/controllers/destroy.controller.js";
import {
	type ProjectNoteShowInput,
	projectNoteShowInputSchema,
} from "./project-note.schema.js";

export class ProjectNoteDestroyController extends DestroyController<ProjectNoteShowInput> {
	protected inputSchema() {
		return projectNoteShowInputSchema;
	}

	protected redirectUrl() {
		return "/project-notes";
	}
}
