import { TagController } from "./tag.controller.js";
import type { TagRepository } from "./tag.service.js";

import { TagService } from "./tag.service.js";

export const createTagModule = ({
	tagRepository,
}: {
	tagRepository: TagRepository;
}) => {
	const tagService = new TagService(tagRepository);
	const tagController = new TagController(tagService);

	return { tagController, tagRepository, tagService };
};
