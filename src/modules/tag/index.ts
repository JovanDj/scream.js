import type { Database } from "@scream.js/database/db.js";
import { TagController } from "./tag.controller.js";

export const createTagModule = ({ db }: { db: Database }) => {
	const tagController = new TagController(db);

	return { tagController };
};
