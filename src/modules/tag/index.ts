import { TagController } from "./tag.controller.js";

export const createTagModule = () => {
	const tagController = new TagController();

	return { tagController };
};
