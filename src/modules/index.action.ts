import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import type { Action } from "./action.js";

export type IndexInput<Input> = Input & {
	readonly limit: number;
	readonly offset: number;
};

export abstract class IndexAction<Input extends { readonly page: number }, Data>
	implements Action
{
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async handle(ctx: HttpContext) {
		const parsedInput = this.inputSchema().safeParse(ctx.query());
		if (!parsedInput.success) {
			return ctx.notFound();
		}

		const pageSize = this.#pageSize();
		const input = {
			...parsedInput.data,
			limit: pageSize + 1,
			offset: (parsedInput.data.page - 1) * pageSize,
		};
		const rows = await this.load(input, this.#db);
		const dataSchema = this.dataSchema();
		dataSchema.parse(rows);
		const data = dataSchema.parse(rows.slice(0, pageSize));
		const locals = this.present(data, input);

		return ctx.render(this.template(), {
			...locals,
			pagination: {
				nextUrl:
					rows.length > pageSize ? this.pageUrl(input, input.page + 1) : "",
				previousUrl: input.page > 1 ? this.pageUrl(input, input.page - 1) : "",
			},
		});
	}

	protected abstract inputSchema(): z.ZodType<Input>;
	protected database() {
		return this.#db;
	}
	protected abstract load(
		input: IndexInput<Input>,
		db: Database,
	): Promise<readonly unknown[]>;
	protected abstract dataSchema(): z.ZodType<Data>;
	protected abstract pageUrl(input: Input, page: number): string;
	protected abstract present(
		data: Data,
		input: Input,
	): Record<PropertyKey, unknown>;
	protected abstract template(): string;

	#pageSize() {
		return 10;
	}
}
