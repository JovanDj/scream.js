import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import type { Action } from "./action.js";

export type StoreFailure<Input> = {
	readonly ctx: HttpContext;
	readonly error: unknown;
	readonly input: Input;
};

export abstract class StoreAction<Input, Result> implements Action {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async handle(ctx: HttpContext) {
		const parsed = this.inputSchema().safeParse(ctx.body());
		if (!parsed.success) {
			return this.validationFailed(ctx, parsed.error);
		}

		try {
			const result = await this.#db.transaction((tx) =>
				this.persist(parsed.data, tx),
			);
			return ctx.redirect(this.redirectUrl(result));
		} catch (error) {
			return this.persistenceFailed({ ctx, error, input: parsed.data });
		}
	}

	protected abstract inputSchema(): z.ZodType<Input>;
	protected abstract persist(input: Input, db: Database): Promise<Result>;
	protected abstract redirectUrl(result: Result): string;
	protected abstract validationFailed(
		ctx: HttpContext,
		error: z.ZodError<Input>,
	): Promise<void>;
	protected abstract persistenceFailed(
		failure: StoreFailure<Input>,
	): void | Promise<void>;
}
