import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import { ProjectService } from "./project.service.js";

export class ProjectController implements Resource {
	readonly #projectService: ProjectService;

	constructor(projectService: ProjectService) {
		this.#projectService = projectService;
	}

	async index(ctx: HttpContext) {
		const projects = await this.#projectService.index();

		return ctx.render("project-index", {
			pageTitle: "Projects",
			projects,
		});
	}

	async show(ctx: HttpContext) {
		const projectId = ctx.param("id", ProjectService.idParamValidator());

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
		const parsed = ctx.body(ProjectService.writeBodyValidator());
		if (!parsed.success) {
			return ctx.render("project-create", {
				errors: parsed.errors,
				fields: {
					name: "",
				},
				pageTitle: "Create Project",
			});
		}

		try {
			const result = await this.#projectService.create(parsed.data.name);
			return ctx.redirect(`/projects/${result}`);
		} catch {
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
		const projectId = ctx.param("id", ProjectService.idParamValidator());

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
		const projectId = ctx.param("id", ProjectService.idParamValidator());

		const parsed = ctx.body(ProjectService.writeBodyValidator());
		if (!parsed.success) {
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
			const result = await this.#projectService.update({
				id: projectId,
				name: parsed.data.name,
			});
			if (!result) {
				return ctx.notFound();
			}

			return ctx.redirect(`/projects/${result.id}`);
		} catch {
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
		const projectId = ctx.param("id", ProjectService.idParamValidator());

		const deleted = await this.#projectService.delete(projectId);
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/projects");
	}

	async archive(ctx: HttpContext) {
		const projectId = ctx.param("id", ProjectService.idParamValidator());

		const result = await this.#projectService.archive({ id: projectId });
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${result.id}`);
	}

	async unarchive(ctx: HttpContext) {
		const projectId = ctx.param("id", ProjectService.idParamValidator());

		const result = await this.#projectService.unarchive({ id: projectId });
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${result.id}`);
	}
}
