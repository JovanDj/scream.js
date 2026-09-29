import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import type { Controller } from "./controller.js";

export abstract class ShowController<Input, Data> implements Controller {
	readonly #service: { execute(input: Input): Promise<Data | undefined> };

	constructor(service: { execute(input: Input): Promise<Data | undefined> }) {
		this.#service = service;
	}

	async handle(ctx: HttpContext) {
		const parsedInput = this.inputSchema().safeParse({ id: ctx.param("id") });
		if (!parsedInput.success) {
			return ctx.notFound();
		}

		const data = await this.#service.execute(parsedInput.data);
		if (data === undefined) {
			return ctx.notFound();
		}
		const locals = this.present(data);

		return ctx.render(this.template(), locals);
	}

	protected abstract inputSchema(): z.ZodType<Input>;
	protected abstract present(data: Data): Record<PropertyKey, unknown>;
	protected abstract template(): string;
}
