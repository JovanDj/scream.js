import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Controller } from "../controller.js";
import type { ListAllProjectsService } from "../project/index.js";
import { projectNoteCreateInputSchema } from "./project-note.schema.js";

export class ProjectNoteCreateController implements Controller {
	readonly #projects: ListAllProjectsService;

	constructor(projects: ListAllProjectsService) {
		this.#projects = projects;
	}

	async handle(ctx: HttpContext) {
		const parsed = projectNoteCreateInputSchema.safeParse(ctx.query());
		if (!parsed.success) {
			return ctx.notFound();
		}
		const projects = await this.#projects.execute();
		const projectId = parsed.data.projectId;
		if (
			projectId !== undefined &&
			!projects.some((project) => project.id === projectId)
		) {
			return ctx.notFound();
		}

		return ctx.render("project-note-form", {
			action: "/project-notes",
			backUrl:
				projectId === undefined ? "/project-notes" : `/projects/${projectId}`,
			cannotSubmit: projects.length === 0,
			errors: { body: "", projectId: "", title: "" },
			fields: {
				body: "",
				projectId: projectId === undefined ? "" : String(projectId),
				title: "",
			},
			isEditing: false,
			noteId: 0,
			pageTitle: "Create Project Note",
			projectName: "",
			projects: projects.map((project) => ({
				...project,
				isSelected: project.id === projectId,
			})),
			submitLabel: "Create",
		});
	}
}
