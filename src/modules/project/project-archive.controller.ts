import type { HttpContext } from "@scream.js/http/http-context.js";
import type { CommandHandler } from "../command-handler.js";
import type { Controller } from "../controller.js";
import {
	type ProjectShowInput,
	projectShowInputSchema,
} from "./project.schema.js";

export class ProjectArchiveController implements Controller {
	readonly #service: CommandHandler<ProjectShowInput, boolean>;

	constructor(service: CommandHandler<ProjectShowInput, boolean>) {
		this.#service = service;
	}

	async handle(ctx: HttpContext) {
		const parsed = projectShowInputSchema.safeParse({ id: ctx.param("id") });
		if (!parsed.success) {
			return ctx.notFound();
		}

		const id = parsed.data.id;
		const result = await this.#service.execute(parsed.data);
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${id}`);
	}
}
