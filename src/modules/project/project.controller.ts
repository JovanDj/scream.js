import type { HttpContext } from "@scream.js/http/http-context.js";
import { schema } from "@scream.js/validator/schema.js";
import type { ProjectModel } from "./project.model.js";

const projectErrors = (
	issues: readonly { message: string; path: PropertyKey[] }[],
) => {
	const errors = { name: "" };

	for (const issue of issues) {
		if (issue.path.join(".") === "name") {
			errors.name ||= issue.message;
		}
	}

	return errors;
};

export class ProjectController {
	readonly #projects: ProjectModel;

	constructor(projects: ProjectModel) {
		this.#projects = projects;
	}

	async index(ctx: HttpContext) {
		const projects = (await this.#projects.list()).map((project) => ({
			id: project.id,
			name: project.name,
			statusCode: project.statusCode,
		}));

		return ctx.render("project-index", {
			pageTitle: "Projects",
			projects,
		});
	}

	async show(ctx: HttpContext) {
		const parsedProjectId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedProjectId.success) {
			return ctx.notFound();
		}
		const projectId = parsedProjectId.data;

		const found = await this.#projects.find(projectId);
		if (found === undefined) {
			return ctx.notFound();
		}
		const project = {
			id: found.id,
			name: found.name,
			statusCode: found.statusCode,
		};

		return ctx.render("project-show", {
			pageTitle: `Project | ${project.name}`,
			project,
		});
	}

	async store(ctx: HttpContext) {
		const parsed = schema
			.strictObject({
				name: schema
					.string()
					.default("")
					.transform((value) => value.trim())
					.refine((value) => value.length > 0, {
						message: "Required",
					}),
			})
			.safeParse(ctx.body());
		if (!parsed.success) {
			return ctx.render("project-create", {
				errors: projectErrors(parsed.error.issues),
				fields: {
					name: "",
				},
				pageTitle: "Create Project",
			});
		}

		try {
			const result = await this.#projects.create(parsed.data.name);
			return ctx.redirect(`/projects/${result}`);
		} catch {
			return ctx.render("project-create", {
				errors: { name: "Project name must be unique" },
				fields: {
					name: parsed.data.name,
				},
				pageTitle: "Create Project",
			});
		}
	}

	async archive(ctx: HttpContext) {
		const parsedProjectId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedProjectId.success) {
			return ctx.notFound();
		}
		const projectId = parsedProjectId.data;

		const result = await this.#projects.archive(projectId);
		if (result === undefined) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${result}`);
	}

	async unarchive(ctx: HttpContext) {
		const parsedProjectId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedProjectId.success) {
			return ctx.notFound();
		}
		const projectId = parsedProjectId.data;

		const result = await this.#projects.unarchive(projectId);
		if (result === undefined) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${result}`);
	}
}
