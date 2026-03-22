import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import { createValidator } from "@scream.js/validator/create-validator.js";
import { schema } from "@scream.js/validator/schema.js";

const projectIdValidator = createValidator(
	schema.coerce.number().int().positive(),
);

const projectWriteValidator = createValidator(
	schema.strictObject({
		name: schema
			.string()
			.default("")
			.transform((value) => value.trim())
			.refine((value) => value.length > 0, {
				message: "Required",
			}),
	}),
);

export class ProjectController implements Resource {
	async index(ctx: HttpContext) {
		const rows = await ctx
			.db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.select(
				"projects.id",
				"projects.name",
				"projects.created_at",
				"projects.updated_at",
				ctx.ref("project_statuses.code").as("status_code"),
			)
			.orderBy("projects.id", "desc");

		const projects = schema
			.array(
				schema.object({
					id: schema.coerce.number(),
					name: schema.string(),
					status_code: schema.enum(["active", "archived"]),
				}),
			)
			.parse(rows)
			.map((project) => ({
				id: project.id,
				name: project.name,
				statusCode: project.status_code,
			}));

		return ctx.render("project-index", {
			pageTitle: "Projects",
			projects,
		});
	}

	async show(ctx: HttpContext) {
		const projectId = ctx.param("id", projectIdValidator);
		if (!projectId) {
			return ctx.notFound();
		}

		const row = await ctx
			.db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.where({ "projects.id": projectId })
			.select(
				"projects.id",
				"projects.name",
				"projects.created_at",
				"projects.updated_at",
				ctx.ref("project_statuses.code").as("status_code"),
			)
			.first();

		if (!row) {
			return ctx.notFound();
		}

		const parsedProject = schema
			.object({
				id: schema.coerce.number(),
				name: schema.string(),
				status_code: schema.enum(["active", "archived"]),
			})
			.parse(row);

		const project = {
			id: parsedProject.id,
			name: parsedProject.name,
			statusCode: parsedProject.status_code,
		};
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
		const parsed = ctx.body(projectWriteValidator);
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
			const result = await ctx.transaction(async (tx) => {
				const status = await tx("project_statuses")
					.where({ code: "active" })
					.first("id");
				if (!status) {
					throw new Error("Project status lookup not found: active");
				}

				const now = new Date().toISOString();
				const [row] = await tx("projects")
					.insert({
						created_at: now,
						name: parsed.data.name,
						status_id: Number(status["id"]),
						updated_at: now,
					})
					.returning(["id"]);

				return { id: Number(row["id"]) };
			});
			return ctx.redirect(`/projects/${result.id}`);
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
		const projectId = ctx.param("id", projectIdValidator);
		if (!projectId) {
			return ctx.notFound();
		}

		const row = await ctx
			.db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.where({ "projects.id": projectId })
			.select(
				"projects.id",
				"projects.name",
				"projects.created_at",
				"projects.updated_at",
				ctx.ref("project_statuses.code").as("status_code"),
			)
			.first();
		if (!row) {
			return ctx.notFound();
		}

		const parsedProject = schema
			.object({
				id: schema.coerce.number(),
				name: schema.string(),
				status_code: schema.enum(["active", "archived"]),
			})
			.parse(row);

		const project = {
			id: parsedProject.id,
			name: parsedProject.name,
			statusCode: parsedProject.status_code,
		};
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
		const projectId = ctx.param("id", projectIdValidator);
		if (!projectId) {
			return ctx.notFound();
		}

		const parsed = ctx.body(projectWriteValidator);
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
			const result = await ctx.transaction(async (tx) => {
				const existing = await tx("projects")
					.join("project_statuses", "projects.status_id", "project_statuses.id")
					.where({ "projects.id": projectId })
					.select(
						"projects.id",
						"projects.name",
						"projects.created_at",
						"projects.updated_at",
						tx.ref("project_statuses.code").as("status_code"),
					)
					.first();

				if (!existing) {
					return undefined;
				}

				const affectedRows = await tx("projects")
					.where({ id: projectId })
					.update({
						name: parsed.data.name,
						updated_at: new Date().toISOString(),
					});

				if (affectedRows === 0) {
					return undefined;
				}

				return { id: projectId };
			});
			if (!result) {
				return ctx.notFound();
			}

			return ctx.redirect(`/projects/${result.id}`);
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
		const projectId = ctx.param("id", projectIdValidator);
		if (!projectId) {
			return ctx.notFound();
		}

		const affectedRows = await ctx
			.db("projects")
			.where({ id: projectId })
			.del();
		const deleted = affectedRows > 0;
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/projects");
	}

	async archive(ctx: HttpContext) {
		const projectId = ctx.param("id", projectIdValidator);
		if (!projectId) {
			return ctx.notFound();
		}

		const result = await ctx.transaction(async (tx) => {
			const existing = await tx("projects")
				.where({ id: projectId })
				.first("id");
			if (!existing) {
				return undefined;
			}

			const status = await tx("project_statuses")
				.where({ code: "archived" })
				.first("id");
			if (!status) {
				throw new Error("Project status lookup not found: archived");
			}

			const affectedRows = await tx("projects")
				.where({ id: projectId })
				.update({
					status_id: Number(status["id"]),
					updated_at: new Date().toISOString(),
				});

			if (affectedRows === 0) {
				return undefined;
			}

			return { id: projectId };
		});
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${result.id}`);
	}

	async unarchive(ctx: HttpContext) {
		const projectId = ctx.param("id", projectIdValidator);
		if (!projectId) {
			return ctx.notFound();
		}

		const result = await ctx.transaction(async (tx) => {
			const existing = await tx("projects")
				.where({ id: projectId })
				.first("id");
			if (!existing) {
				return undefined;
			}

			const status = await tx("project_statuses")
				.where({ code: "active" })
				.first("id");
			if (!status) {
				throw new Error("Project status lookup not found: active");
			}

			const affectedRows = await tx("projects")
				.where({ id: projectId })
				.update({
					status_id: Number(status["id"]),
					updated_at: new Date().toISOString(),
				});

			if (affectedRows === 0) {
				return undefined;
			}

			return { id: projectId };
		});
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${result.id}`);
	}
}
