import type { CommandHandler } from "@scream.js/database/command-handler.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Controller } from "../controller.js";
import type { ReplaceTodoTags } from "./replace-todo-tags.service.js";
import {
	tagAssignmentInputSchema,
	tagAssignmentTodoSchema,
} from "./tag.schema.js";

export class TagAssignController implements Controller {
	readonly #replaceTodoTags: CommandHandler<ReplaceTodoTags, boolean>;

	constructor(replaceTodoTags: CommandHandler<ReplaceTodoTags, boolean>) {
		this.#replaceTodoTags = replaceTodoTags;
	}

	async handle(ctx: HttpContext) {
		const parsedTodoId = tagAssignmentTodoSchema.safeParse({
			id: ctx.param("id"),
		});
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}
		const todoId = parsedTodoId.data.id;

		const parsed = tagAssignmentInputSchema.safeParse(ctx.body());
		if (!parsed.success) {
			return ctx.redirect(`/todos/${todoId}/edit`);
		}

		const replaced = await this.#replaceTodoTags.execute({
			tagIds: parsed.data.tagIds,
			todoId,
		});

		if (!replaced) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${todoId}/edit`);
	}
}
