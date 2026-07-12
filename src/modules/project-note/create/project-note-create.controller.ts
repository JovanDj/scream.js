import type { CommandHandler } from "@scream.js/database/command-handler.js";
import { CreateController } from "@scream.js/http/controllers/create.controller.js";
import {
	type ProjectNoteCreateData,
	type ProjectNoteCreateInput,
	projectNoteCreateInputSchema,
} from "../project-note.schema.js";

export class ProjectNoteCreateController extends CreateController<
	ProjectNoteCreateInput,
	ProjectNoteCreateData
> {
	readonly #projects: CommandHandler<void, ProjectNoteCreateData["projects"]>;

	constructor(
		projects: CommandHandler<void, ProjectNoteCreateData["projects"]>,
	) {
		super();
		this.#projects = projects;
	}

	protected inputSchema() {
		return projectNoteCreateInputSchema;
	}

	protected async load(input: ProjectNoteCreateInput) {
		const projects = await this.#projects.execute();
		const projectId = input.projectId;
		if (
			projectId !== undefined &&
			!projects.some((project) => project.id === projectId)
		) {
			return undefined;
		}

		return { ...input, projects };
	}

	protected present({ projectId, projects }: ProjectNoteCreateData) {
		return {
			action: "/project-notes",
			backUrl:
				projectId === undefined ? "/project-notes" : `/projects/${projectId}`,
			cannotSubmit: projects.length === 0 ? true : undefined,
			errors: {},
			fields: {
				body: "",
				projectId: projectId === undefined ? "" : String(projectId),
				title: "",
			},
			homeUrl: "/",
			isEditing: undefined,
			noteId: 0,
			notesUrl: "/project-notes",
			projectName: "",
			projects: projects.map((project) => ({
				...project,
				isSelected: project.id === projectId ? true : undefined,
			})),
			projectsUrl: "/projects",
			tagsUrl: "/tags",
			todosUrl: "/todos",
		};
	}

	protected template() {
		return "project-note/form";
	}
}
