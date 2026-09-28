import type { Database } from "@scream.js/database/db.js";
import { DestroyAction } from "../destroy.action.js";
import { type TagShowInput, tagShowInputSchema } from "./tag.schema.js";

export class TagDestroyAction extends DestroyAction<TagShowInput> {
	protected inputSchema() {
		return tagShowInputSchema;
	}

	protected async remove(input: TagShowInput, db: Database) {
		return (await db("tags").where({ id: input.id }).del()) > 0;
	}

	protected redirectUrl() {
		return "/tags";
	}
}
