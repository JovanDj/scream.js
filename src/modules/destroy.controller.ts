import type { CommandHandler } from "@scream.js/database/command-handler.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import type { Controller } from "./controller.js";

export abstract class DestroyController<Input> implements Controller {
	readonly #service: CommandHandler<Input, boolean>;

	constructor(service: CommandHandler<Input, boolean>) {
		this.#service = service;
	}

	async handle(ctx: HttpContext) {
		const parsed = this.inputSchema().safeParse({ id: ctx.param("id") });
		if (!parsed.success) {
			return ctx.notFound();
		}

		const deleted = await this.#service.execute(parsed.data);
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect(this.redirectUrl());
	}

	protected abstract inputSchema(): z.ZodType<Input>;
	protected abstract redirectUrl(): string;
}
