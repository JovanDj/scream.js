import type { z } from "zod/v4";
import type { CommandHandler } from "../../database/command-handler.js";
import type { Controller } from "../controller.js";
import type { HttpContext } from "../http-context.js";

export type StoreFailure<Input> = {
	readonly ctx: HttpContext;
	readonly error: unknown;
	readonly input: Input;
};

export abstract class StoreController<Input, Result> implements Controller {
	readonly #service: CommandHandler<Input, Result>;

	constructor(service: CommandHandler<Input, Result>) {
		this.#service = service;
	}

	async handle(ctx: HttpContext) {
		const parsed = this.inputSchema().safeParse(ctx.body());
		if (!parsed.success) {
			return this.validationFailed(ctx, parsed.error);
		}

		try {
			const result = await this.#service.execute(parsed.data);
			return ctx.redirect(this.redirectUrl(result));
		} catch (error) {
			return this.persistenceFailed({ ctx, error, input: parsed.data });
		}
	}

	protected abstract inputSchema(): z.ZodType<Input>;
	protected abstract redirectUrl(result: Result): string;
	protected abstract validationFailed(
		ctx: HttpContext,
		error: z.ZodError<Input>,
	): Promise<void>;
	protected abstract persistenceFailed(
		failure: StoreFailure<Input>,
	): void | Promise<void>;
}
