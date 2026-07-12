import { ShowController } from "@scream.js/http/controllers/show.controller.js";
import type { ProjectShowData, ProjectShowInput } from "./project.schema.js";
import { projectShowInputSchema } from "./project.schema.js";

export class ProjectShowController extends ShowController<
	ProjectShowInput,
	ProjectShowData
> {
	protected inputSchema() {
		return projectShowInputSchema;
	}

	protected present(project: ProjectShowData) {
		return {
			createNoteUrl: `/project-notes/create?projectId=${project.id}`,
			homeUrl: "/",
			notesUrl: "/project-notes",
			project,
			projectNotesUrl: `/project-notes?projectId=${project.id}`,
			tagsUrl: "/tags",
			todosUrl: "/todos",
		};
	}

	protected template() {
		return "project/show";
	}
}
