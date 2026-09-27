import type { Database } from "@scream.js/database/db.js";
import { ShowAction } from "../show.action.js";
import type { TagShowData, TagShowInput } from "./tag.schema.js";
import { tagShowDataSchema, tagShowInputSchema } from "./tag.schema.js";

export class TagShowAction extends ShowAction<TagShowInput, TagShowData> {
	protected inputSchema() {
		return tagShowInputSchema;
	}

	protected async load(input: TagShowInput, db: Database) {
		return db("tags").where({ id: input.id }).select("id", "name").first();
	}

	protected dataSchema() {
		return tagShowDataSchema;
	}

	protected present(tag: TagShowData) {
		return { pageTitle: `Tag | ${tag.name}`, tag };
	}

	protected template() {
		return "tag-show";
	}
}
