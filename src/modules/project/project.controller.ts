import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import { projectIdValidator, projectWriteValidator } from "./project.schema.js";
import type { ProjectService } from "./project.service.js";

export class ProjectController implements Resource {
	readonly #projectService: ProjectService;

	constructor(projectService: ProjectService) {
		this.#projectService = projectService;
	}

	async index(ctx: HttpContext) {
		const projects = await this.#projectService.findAll({
			includeArchived: true,
		});

		return ctx.render("project-index", {
			pageTitle: "Projects",
			projects,
		});
	}

	async show(ctx: HttpContext) {
		const parsedProjectId = ctx.validateParam("id", projectIdValidator);
		if (!parsedProjectId.success) {
			return ctx.notFound();
		}

		const projectId = parsedProjectId.data;
		const project = await this.#projectService.findById(projectId);
		if (!project) {
			return ctx.notFound();
		}

		return ctx.render("project-show", {
			pageTitle: `Project | ${project.name}`,
			project,
		});
	}

	async create(ctx: HttpContext) {
		return ctx.render("project-create", {
			errors: {},
			fields: {
				name: "",
			},
			pageTitle: "Create Project",
		});
	}

	async store(ctx: HttpContext) {
		const parsed = ctx.validateBody(projectWriteValidator);
		if (!parsed.success) {
			ctx.unprocessableEntity();
			return ctx.render("project-create", {
				errors: parsed.errors,
				fields: {
					name: "",
				},
				pageTitle: "Create Project",
			});
		}

		try {
			const project = await this.#projectService.create(parsed.data);
			return ctx.redirect(`/projects/${project.id}`);
		} catch {
			ctx.unprocessableEntity();
			return ctx.render("project-create", {
				errors: { name: ["Project name must be unique"] },
				fields: {
					name: parsed.data.name,
				},
				pageTitle: "Create Project",
			});
		}
	}

	async edit(ctx: HttpContext) {
		const parsedProjectId = ctx.validateParam("id", projectIdValidator);
		if (!parsedProjectId.success) {
			return ctx.notFound();
		}

		const projectId = parsedProjectId.data;
		const project = await this.#projectService.findById(projectId);
		if (!project) {
			return ctx.notFound();
		}

		return ctx.render("project-edit", {
			action: `/projects/${project.id}/edit`,
			errors: {},
			fields: {
				name: project.name,
			},
			pageTitle: "Edit Project",
			project,
			submitLabel: "Update",
		});
	}

	async update(ctx: HttpContext) {
		const parsedProjectId = ctx.validateParam("id", projectIdValidator);
		if (!parsedProjectId.success) {
			return ctx.notFound();
		}

		const projectId = parsedProjectId.data;
		const parsed = ctx.validateBody(projectWriteValidator);
		if (!parsed.success) {
			ctx.unprocessableEntity();
			return ctx.render("project-edit", {
				action: `/projects/${projectId}/edit`,
				errors: parsed.errors,
				fields: {
					name: "",
				},
				pageTitle: "Edit Project",
				project: { id: projectId },
				submitLabel: "Update",
			});
		}

		try {
			const updated = await this.#projectService.update(projectId, parsed.data);
			if (!updated) {
				return ctx.notFound();
			}

			return ctx.redirect(`/projects/${updated.id}`);
		} catch {
			ctx.unprocessableEntity();
			return ctx.render("project-edit", {
				action: `/projects/${projectId}/edit`,
				errors: { name: ["Project name must be unique"] },
				fields: {
					name: parsed.data.name,
				},
				pageTitle: "Edit Project",
				project: { id: projectId },
				submitLabel: "Update",
			});
		}
	}

	async delete(ctx: HttpContext) {
		const parsedProjectId = ctx.validateParam("id", projectIdValidator);
		if (!parsedProjectId.success) {
			return ctx.notFound();
		}

		const projectId = parsedProjectId.data;
		const deleted = await this.#projectService.delete(projectId);
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/projects");
	}

	async archive(ctx: HttpContext) {
		const parsedProjectId = ctx.validateParam("id", projectIdValidator);
		if (!parsedProjectId.success) {
			return ctx.notFound();
		}

		const projectId = parsedProjectId.data;
		const project = await this.#projectService.archive(projectId);
		if (!project) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${project.id}`);
	}

	async unarchive(ctx: HttpContext) {
		const parsedProjectId = ctx.validateParam("id", projectIdValidator);
		if (!parsedProjectId.success) {
			return ctx.notFound();
		}

		const projectId = parsedProjectId.data;
		const project = await this.#projectService.unarchive(projectId);
		if (!project) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${project.id}`);
	}
}
