import type { CommandHandler } from "@scream.js/database/command-handler.js";
import {
	StoreController,
	type StoreFailure,
} from "@scream.js/http/controllers/store.controller.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import {
	type TagIndexData,
	type TagStoreInput,
	tagStoreInputSchema,
} from "./tag.schema.js";

export class TagStoreController extends StoreController<TagStoreInput, void> {
	readonly #listAllTags: CommandHandler<void, TagIndexData>;

	constructor(
		service: CommandHandler<TagStoreInput>,
		listAllTags: CommandHandler<void, TagIndexData>,
	) {
		super(service);
		this.#listAllTags = listAllTags;
	}

	protected inputSchema() {
		return tagStoreInputSchema;
	}

	protected redirectUrl() {
		return "/tags";
	}

	protected validationFailed(
		ctx: HttpContext,
		error: z.ZodError<TagStoreInput>,
	) {
		const errors = { name: "" };
		for (const issue of error.issues) {
			if (issue.path.join(".") === "name") {
				errors.name ||= issue.message;
			}
		}
		return this.#renderErrors(ctx, errors);
	}

	protected persistenceFailed({ ctx, error }: StoreFailure<TagStoreInput>) {
		if (
			!(error instanceof Error) ||
			!("code" in error) ||
			error.code !== "SQLITE_CONSTRAINT_UNIQUE" ||
			!error.message.endsWith("UNIQUE constraint failed: tags.name")
		) {
			throw error;
		}

		return this.#renderErrors(ctx, {
			name: "Tag name must be unique",
		});
	}

	async #renderErrors(ctx: HttpContext, errors: { name: string }) {
		const tags = await this.#listAllTags.execute();

		return ctx.render("tag-index", {
			errors,
			pageTitle: "Tags",
			pagination: { nextUrl: "", previousUrl: "" },
			sorts: {
				created: "/tags?sort=created&direction=desc",
				name: "/tags?direction=desc",
			},
			tags,
		});
	}
}
