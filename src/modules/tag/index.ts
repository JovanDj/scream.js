import type { Database } from "@scream.js/database/db.js";
import { TagController } from "./tag.controller.js";
import { TagService } from "./tag.service.js";

export const createTagModule = ({ db }: { db: Database }) => {
	const tagService = new TagService(db);
	const tagController = new TagController(tagService);

	return { tagController, tagService };
};
