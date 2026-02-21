import type { Knex } from "knex";
import { TagController } from "./tag.controller.js";
import { TagService } from "./tag.service.js";

export const createTagModule = ({ db }: { db: Knex }) => {
	// Single-use composition seam is kept intentionally for app bootstrap boundaries.
	const tagService = new TagService(db);
	const tagController = new TagController(tagService);

	return { tagController, tagService };
};
