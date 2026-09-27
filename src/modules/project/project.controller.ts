import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import { schema } from "@scream.js/validator/schema.js";

export class ProjectController {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async store(ctx: HttpContext) {
		const parsed = schema
			.strictObject({
				name: schema
					.string()
					.default("")
					.transform((value) => value.trim())
					.refine((value) => value.length > 0, { message: "Required" }),
			})
			.safeParse(ctx.body());
		if (!parsed.success) {
			return ctx.render("project-create", {
				errors: this.#projectErrors(parsed.error.issues),
				fields: { name: "" },
				pageTitle: "Create Project",
			});
		}

		try {
			const result = await this.#db.transaction(async (tx) => {
				const projectStatusRow = await tx("project_statuses")
					.where({ code: "active" })
					.first("id");
				const projectStatus = schema
					.object({ id: schema.coerce.number().positive() })
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
				fields: { name: parsed.data.name },
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

	#projectErrors(issues: readonly { message: string; path: PropertyKey[] }[]) {
		const errors = { name: "" };

		for (const issue of issues) {
			if (issue.path.join(".") === "name") {
				errors.name ||= issue.message;
			}
		}

		return errors;
	}
}
