import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import type { Action } from "./action.js";

export abstract class DestroyAction<Input> implements Action {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async handle(ctx: HttpContext) {
		const parsed = this.inputSchema().safeParse({ id: ctx.param("id") });
		if (!parsed.success) {
			return ctx.notFound();
		}

		const deleted = await this.remove(parsed.data, this.#db);
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect(this.redirectUrl());
	}

	protected abstract inputSchema(): z.ZodType<Input>;
	protected abstract remove(input: Input, db: Database): Promise<boolean>;
	protected abstract redirectUrl(): string;
}
