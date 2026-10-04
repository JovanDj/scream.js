import { IndexController } from "@scream.js/http/controllers/index.controller.js";
import {
	type ProjectNoteIndexData,
	type ProjectNoteIndexInput,
	projectNoteIndexInputSchema,
} from "./project-note.schema.js";

export class ProjectNoteIndexController extends IndexController<
	ProjectNoteIndexInput,
	ProjectNoteIndexData
> {
	protected inputSchema() {
		return projectNoteIndexInputSchema;
	}

	protected pageUrl(input: ProjectNoteIndexInput, page: number) {
		const query = new URLSearchParams();
		if (input.projectId !== undefined) {
			query.set("projectId", String(input.projectId));
		}
		if (page > 1) {
			query.set("page", String(page));
		}
		const suffix = query.toString();
		return suffix ? `/project-notes?${suffix}` : "/project-notes";
	}

	protected present(notes: ProjectNoteIndexData, input: ProjectNoteIndexInput) {
		return {
			createUrl:
				input.projectId === undefined
					? "/project-notes/create"
					: `/project-notes/create?projectId=${input.projectId}`,
			isFiltered: input.projectId !== undefined,
			notes,
			pageTitle: "Project Notes",
			projectUrl:
				input.projectId === undefined
					? "/projects"
					: `/projects/${input.projectId}`,
		};
	}

	protected template() {
		return "project-note-index";
	}
}
