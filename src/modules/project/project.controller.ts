import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import { schema } from "@scream.js/validator/schema.js";

export class ProjectController implements Resource {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async index(ctx: HttpContext) {
		const rows = await this.#db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.select(
				"projects.id",
				"projects.name",
				this.#db.ref("project_statuses.code").as("status_code"),
			)
			.orderBy("projects.id", "desc");
		const projects = schema
			.array(
				schema.object({
					id: schema.coerce.number().int().positive(),
					name: schema.string(),
					status_code: schema.enum(["active", "archived"]),
				}),
			)
			.transform((parsedRows) =>
				parsedRows.map((row) => ({
					id: row.id,
					name: row.name,
					statusCode: row.status_code,
				})),
			)
			.parse(rows);

		return ctx.render("project-index", {
			pageTitle: "Projects",
			projects: projects.map((project) => ({
				...project,
				isArchived: project.statusCode === "archived",
			})),
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

		const row = await this.#db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.where({ "projects.id": projectId })
			.select(
				"projects.id",
				"projects.name",
				this.#db.ref("project_statuses.code").as("status_code"),
			)
			.first();
		if (!row) {
			return ctx.notFound();
		}
		const project = schema
			.object({
				id: schema.coerce.number().int().positive(),
				name: schema.string(),
				status_code: schema.enum(["active", "archived"]),
			})
			.transform((parsedRow) => ({
				id: parsedRow.id,
				name: parsedRow.name,
				statusCode: parsedRow.status_code,
			}))
			.parse(row);

		return ctx.render("project-show", {
			pageTitle: `Project | ${project.name}`,
			project: {
				...project,
				isArchived: project.statusCode === "archived",
			},
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
				errors: parsed.error.issues.reduce<Record<string, string[]>>(
					(errors, issue) => {
						const key = issue.path.join(".");
						if (!errors[key]) {
							errors[key] = [];
						}
						errors[key].push(issue.message);
						return errors;
					},
					{},
				),
				fields: {
					name: "",
				},
				pageTitle: "Create Project",
			});
		}

		try {
			const result = await this.#db.transaction(async (tx) => {
				const projectStatusRow = await tx("project_statuses")
					.where({ code: "active" })
					.first("id");

				if (!projectStatusRow) {
					throw new Error("Project status lookup not found: active");
				}

				const projectStatus = schema
					.object({
						id: schema.coerce.number().positive(),
					})
					.parse(projectStatusRow);

				const now = new Date().toISOString();
				const [row] = await tx("projects")
					.insert({
						created_at: now,
						name: parsed.data.name,
						status_id: projectStatus.id,
						updated_at: now,
					})
					.returning(["id"]);

				return schema
					.object({
						id: schema.coerce.number().int().positive(),
					})
					.parse(row).id;
			});
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
		const parsedProjectId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedProjectId.success) {
			return ctx.notFound();
		}
		const projectId = parsedProjectId.data;

		const row = await this.#db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.where({ "projects.id": projectId })
			.select(
				"projects.id",
				"projects.name",
				this.#db.ref("project_statuses.code").as("status_code"),
			)
			.first();
		if (!row) {
			return ctx.notFound();
		}
		const project = schema
			.object({
				id: schema.coerce.number().int().positive(),
				name: schema.string(),
				status_code: schema.enum(["active", "archived"]),
			})
			.transform((parsedRow) => ({
				id: parsedRow.id,
				name: parsedRow.name,
				statusCode: parsedRow.status_code,
			}))
			.parse(row);

		return ctx.render("project-edit", {
			action: `/projects/${project.id}`,
			errors: {},
			fields: {
				name: project.name,
			},
			pageTitle: "Edit Project",
			project: {
				...project,
				isArchived: project.statusCode === "archived",
			},
			submitLabel: "Update",
		});
	}

	async update(ctx: HttpContext) {
		const parsedProjectId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedProjectId.success) {
			return ctx.notFound();
		}
		const projectId = parsedProjectId.data;

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
			return ctx.render("project-edit", {
				action: `/projects/${projectId}`,
				errors: parsed.error.issues.reduce<Record<string, string[]>>(
					(errors, issue) => {
						const key = issue.path.join(".");
						if (!errors[key]) {
							errors[key] = [];
						}
						errors[key].push(issue.message);
						return errors;
					},
					{},
				),
				fields: {
					name: "",
				},
				pageTitle: "Edit Project",
				project: { id: projectId, isArchived: false },
				submitLabel: "Update",
			});
		}

		try {
			const result = await this.#db.transaction(async (tx) => {
				const existing = await tx("projects")
					.where({ id: projectId })
					.first("id");
				if (!existing) {
					return;
				}

				const current = schema
					.object({
						id: schema.coerce.number().int().positive(),
					})
					.parse(existing);

				const affectedRows = await tx("projects")
					.where({ id: projectId })
					.update({
						name: parsed.data.name,
						updated_at: new Date().toISOString(),
					});
				if (affectedRows === 0) {
					return undefined;
				}

				return { id: current.id };
			});
			if (!result) {
				return ctx.notFound();
			}

			return ctx.redirect(`/projects/${result.id}`);
		} catch {
			return ctx.render("project-edit", {
				action: `/projects/${projectId}`,
				errors: { name: ["Project name must be unique"] },
				fields: {
					name: parsed.data.name,
				},
				pageTitle: "Edit Project",
				project: { id: projectId, isArchived: false },
				submitLabel: "Update",
			});
		}
	}

	async destroy(ctx: HttpContext) {
		const parsedProjectId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedProjectId.success) {
			return ctx.notFound();
		}
		const projectId = parsedProjectId.data;

		const deleted =
			(await this.#db("projects").where({ id: projectId }).del()) > 0;
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/projects");
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

		const result = await this.#db.transaction(async (tx) => {
			const existing = await tx("projects")
				.where({ id: projectId })
				.first("id");
			if (!existing) {
				return;
			}

			const current = schema
				.object({
					id: schema.coerce.number().int().positive(),
				})
				.parse(existing);
			const statusRow = await tx("project_statuses")
				.where({ code: "archived" })
				.first("id");
			if (!statusRow) {
				throw new Error("Project status lookup not found: archived");
			}

			const status = schema
				.object({
					id: schema.coerce.number().positive(),
				})
				.parse(statusRow);

			const affectedRows = await tx("projects")
				.where({ id: projectId })
				.update({
					status_id: status.id,
					updated_at: new Date().toISOString(),
				});
			if (affectedRows === 0) {
				return undefined;
			}

			return { id: current.id };
		});
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${result.id}`);
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

		const result = await this.#db.transaction(async (tx) => {
			const existing = await tx("projects")
				.where({ id: projectId })
				.first("id");
			if (!existing) {
				return;
			}

			const current = schema
				.object({
					id: schema.coerce.number().int().positive(),
				})
				.parse(existing);
			const statusRow = await tx("project_statuses")
				.where({ code: "active" })
				.first("id");
			if (!statusRow) {
				throw new Error("Project status lookup not found: active");
			}

			const status = schema
				.object({
					id: schema.coerce.number().positive(),
				})
				.parse(statusRow);

			const affectedRows = await tx("projects")
				.where({ id: projectId })
				.update({
					status_id: status.id,
					updated_at: new Date().toISOString(),
				});
			if (affectedRows === 0) {
				return undefined;
			}

			return { id: current.id };
		});
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${result.id}`);
	}
}
