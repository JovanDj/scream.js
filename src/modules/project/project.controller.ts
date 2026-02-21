import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import type { ProjectService } from "./project.service.js";

export class ProjectController implements Resource {
	readonly #projectService: ProjectService;

	constructor(projectService: ProjectService) {
		this.#projectService = projectService;
	}

	#projectId(ctx: HttpContext) {
		const parsedId = ctx.param("id", (z) => z.coerce.number().int().positive());
		if (!parsedId.success) {
			return undefined;
		}

		return parsedId.data;
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
		const projectId = this.#projectId(ctx);
		if (!projectId) {
			return ctx.notFound();
		}

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
		const parsed = ctx.body((z) =>
			z.strictObject({
				name: z
					.string()
					.default("")
					.transform((value) => value.trim()),
			}),
		);

		if (!parsed.success || parsed.data.name.length < 1) {
			ctx.unprocessableEntity();

			return ctx.render("project-create", {
				errors: { name: ["Required"] },
				fields: parsed.success ? parsed.data : { name: "" },
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
				fields: parsed.data,
				pageTitle: "Create Project",
			});
		}
	}

	async edit(ctx: HttpContext) {
		const projectId = this.#projectId(ctx);
		if (!projectId) {
			return ctx.notFound();
		}

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
		const projectId = this.#projectId(ctx);
		if (!projectId) {
			return ctx.notFound();
		}

		const parsed = ctx.body((z) =>
			z.strictObject({
				name: z
					.string()
					.default("")
					.transform((value) => value.trim()),
			}),
		);

		if (!parsed.success || parsed.data.name.length < 1) {
			ctx.unprocessableEntity();
			return ctx.render("project-edit", {
				action: `/projects/${projectId}/edit`,
				errors: { name: ["Required"] },
				fields: parsed.success ? parsed.data : { name: "" },
				pageTitle: "Edit Project",
				project: { id: projectId },
				submitLabel: "Update",
			});
		}

		const updated = await this.#projectService.update(projectId, parsed.data);
		if (!updated) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${updated.id}`);
	}

	async delete(ctx: HttpContext) {
		const projectId = this.#projectId(ctx);
		if (!projectId) {
			return ctx.notFound();
		}

		const deleted = await this.#projectService.delete(projectId);
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/projects");
	}

	async archive(ctx: HttpContext) {
		const projectId = this.#projectId(ctx);
		if (!projectId) {
			return ctx.notFound();
		}

		const project = await this.#projectService.archive(projectId);
		if (!project) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${project.id}`);
	}

	async unarchive(ctx: HttpContext) {
		const projectId = this.#projectId(ctx);
		if (!projectId) {
			return ctx.notFound();
		}

		const project = await this.#projectService.unarchive(projectId);
		if (!project) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${project.id}`);
	}
}
