import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import { schema } from "@scream.js/validator/schema.js";

export class ProjectController {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
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
