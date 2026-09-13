import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import type { Action } from "./action.js";

export abstract class IndexAction<Input, Data> implements Action {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async handle(ctx: HttpContext) {
		const input = this.inputSchema().safeParse(ctx.query());
		if (!input.success) {
			return ctx.notFound();
		}

		const rows = await this.load(input.data, this.#db);
		const data = this.dataSchema().parse(rows);
		const locals = this.present(data, input.data);

		return ctx.render(this.template(), locals);
	}

	protected abstract inputSchema(): z.ZodType<Input>;
	protected abstract load(input: Input, db: Database): Promise<unknown>;
	protected abstract dataSchema(): z.ZodType<Data>;
	protected abstract present(
		data: Data,
		input: Input,
	): Record<PropertyKey, unknown>;
	protected abstract template(): string;
}
