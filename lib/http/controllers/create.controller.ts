import type { z } from "zod/v4";
import type { Controller } from "../controller.js";
import type { HttpContext } from "../http-context.js";

export abstract class CreateController<Input, Data> implements Controller {
	async handle(ctx: HttpContext) {
		const parsedInput = this.inputSchema().safeParse(ctx.query());
		if (!parsedInput.success) {
			return ctx.notFound();
		}

		const data = await this.load(parsedInput.data);
		if (data === undefined) {
			return ctx.notFound();
		}
		const locals = this.present(data);

		return ctx.render(this.template(), locals);
	}

	protected abstract inputSchema(): z.ZodType<Input>;
	protected abstract load(
		input: Input,
	): Data | undefined | Promise<Data | undefined>;
	protected abstract present(data: Data): Record<PropertyKey, unknown>;
	protected abstract template(): string;
}
