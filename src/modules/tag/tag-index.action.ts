import type { Database } from "@scream.js/database/db.js";
import { IndexAction } from "../index.action.js";
import type { TagIndexData, TagIndexInput } from "./tag.schema.js";
import { tagIndexDataSchema, tagIndexInputSchema } from "./tag.schema.js";

export class TagIndexAction extends IndexAction<TagIndexInput, TagIndexData> {
	protected inputSchema() {
		return tagIndexInputSchema;
	}

	protected async load(_input: TagIndexInput, db: Database) {
		return db("tags")
			.select("tags.id", "tags.name", "tags.created_at", "tags.updated_at")
			.orderBy("tags.name", "asc");
	}

	protected dataSchema() {
		return tagIndexDataSchema;
	}

	protected present(tags: TagIndexData) {
		return {
			errors: { name: "" },
			pageTitle: "Tags",
			tags,
		};
	}

	protected template() {
		return "tag-index";
	}
}
