import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import { schema } from "@scream.js/validator/schema.js";

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
			const result = await this.#db.transaction(async (tx) => {
				const projectStatusRow = await tx("project_statuses")
					.where({ code: "active" })
					.first("id");

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

				return row.id;
			});
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

		const result = await this.#db.transaction(async (tx) => {
			const existing = await tx("projects")
				.where({ id: projectId })
				.first("id");
			if (!existing) {
				return;
			}

			const current = existing as { id: number };
			const statusRow = await tx("project_statuses")
				.where({ code: "archived" })
				.first("id");

			await tx("projects")
				.where({ id: projectId })
				.update({
					status_id: (statusRow as { id: number }).id,
					updated_at: new Date().toISOString(),
				});

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

			const current = existing as { id: number };
			const statusRow = await tx("project_statuses")
				.where({ code: "active" })
				.first("id");

			await tx("projects")
				.where({ id: projectId })
				.update({
					status_id: (statusRow as { id: number }).id,
					updated_at: new Date().toISOString(),
				});

			return { id: current.id };
		});
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${result.id}`);
	}
}
