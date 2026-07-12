import type { z } from "zod/v4";
import type { CommandHandler } from "../../database/command-handler.js";
import type { Controller } from "../controller.js";
import type { HttpContext } from "../http-context.js";

export type IndexInput<Input> = Input & {
	readonly limit: number;
	readonly offset: number;
};

export abstract class IndexController<
	Input extends { readonly page: number },
	Data extends unknown[],
> implements Controller
{
	readonly #service: CommandHandler<IndexInput<Input>, Data>;

	constructor(service: CommandHandler<IndexInput<Input>, Data>) {
		this.#service = service;
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
		const rows = await this.#service.execute(input);
		const data = rows.slice(0, pageSize);
		const locals = this.present(data, input);

		return ctx.render(this.template(), {
			...locals,
			pagination: {
				nextUrl:
					rows.length > pageSize
						? this.pageUrl(input, input.page + 1)
						: undefined,
				previousUrl:
					input.page > 1 ? this.pageUrl(input, input.page - 1) : undefined,
			},
		});
	}

	protected abstract inputSchema(): z.ZodType<Input>;
	protected abstract pageUrl(input: Input, page: number): string;
	protected abstract present(
		data: Data[number][],
		input: Input,
	): Record<PropertyKey, unknown>;
	protected abstract template(): string;

	#pageSize() {
		return 10;
	}
}
