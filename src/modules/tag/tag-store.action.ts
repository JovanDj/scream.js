import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import { StoreAction, type StoreFailure } from "../store.action.js";
import {
	type TagStoreInput,
	tagIndexDataSchema,
	tagStoreInputSchema,
} from "./tag.schema.js";

export class TagStoreAction extends StoreAction<TagStoreInput, void> {
	readonly #db: Database;

	constructor(db: Database) {
		super(db);
		this.#db = db;
	}

	protected inputSchema() {
		return tagStoreInputSchema;
	}

	protected async persist(input: TagStoreInput, db: Database) {
		const now = new Date().toISOString();
		await db("tags").insert({
			created_at: now,
			name: input.name,
			updated_at: now,
		});
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

	protected persistenceFailed({ ctx }: StoreFailure<TagStoreInput>) {
		return this.#renderErrors(ctx, {
			name: "Tag name must be unique",
		});
	}

	async #renderErrors(ctx: HttpContext, errors: { name: string }) {
		const rows = await this.#db("tags")
			.select("tags.id", "tags.name", "tags.created_at", "tags.updated_at")
			.orderBy("tags.name", "asc")
			.orderBy("tags.id", "desc");
		const tags = tagIndexDataSchema.parse(rows);

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
