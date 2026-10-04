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
		return { pageTitle: `Project | ${project.name}`, project };
	}

	protected template() {
		return "project/show";
	}
}
