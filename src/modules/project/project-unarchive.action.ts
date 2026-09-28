import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import { schema } from "@scream.js/validator/schema.js";
import type { Action } from "../action.js";
import { projectShowInputSchema } from "./project.schema.js";

export class ProjectUnarchiveAction implements Action {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async handle(ctx: HttpContext) {
		const parsed = projectShowInputSchema.safeParse({ id: ctx.param("id") });
		if (!parsed.success) {
			return ctx.notFound();
		}

		const id = parsed.data.id;
		const result = await this.#db.transaction(async (tx) => {
			const existing = await tx("projects").where({ id }).first("id");
			if (!existing) {
				return false;
			}

			const statusRow = await tx("project_statuses")
				.where({ code: "active" })
				.first("id");
			const status = schema
				.object({ id: schema.coerce.number().positive() })
				.parse(statusRow);
			await tx("projects").where({ id }).update({
				status_id: status.id,
				updated_at: new Date().toISOString(),
			});
			return true;
		});
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${id}`);
	}
}
