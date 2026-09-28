import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import { StoreController, type StoreFailure } from "../store.controller.js";
import {
	type TagStoreInput,
	tagIndexDataSchema,
	tagStoreInputSchema,
} from "./tag.schema.js";

export class TagStoreController extends StoreController<TagStoreInput, void> {
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
