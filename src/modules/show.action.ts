import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import type { Action } from "./action.js";

export abstract class ShowAction<Input, Data> implements Action {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async handle(ctx: HttpContext) {
		const parsedInput = this.inputSchema().safeParse({ id: ctx.param("id") });
		if (!parsedInput.success) {
			return ctx.notFound();
		}

		const row = await this.load(parsedInput.data, this.#db);
		if (row === undefined || row === null) {
			return ctx.notFound();
		}
		const data = this.dataSchema().parse(row);
		const locals = this.present(data);

		return ctx.render(this.template(), locals);
	}

	protected abstract inputSchema(): z.ZodType<Input>;
	protected abstract load(input: Input, db: Database): Promise<unknown>;
	protected abstract dataSchema(): z.ZodType<Data>;
	protected abstract present(data: Data): Record<PropertyKey, unknown>;
	protected abstract template(): string;
}
