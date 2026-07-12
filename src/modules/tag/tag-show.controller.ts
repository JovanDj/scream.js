import { ShowController } from "@scream.js/http/controllers/show.controller.js";
import type { TagShowData, TagShowInput } from "./tag.schema.js";
import { tagShowInputSchema } from "./tag.schema.js";

export class TagShowController extends ShowController<
	TagShowInput,
	TagShowData
> {
	protected inputSchema() {
		return tagShowInputSchema;
	}

	protected present(tag: TagShowData) {
		return {
			homeUrl: "/",
			notesUrl: "/project-notes",
			tag,
			tagsUrl: "/tags",
			todosUrl: "/todos",
		};
	}

	protected template() {
		return "tag/show";
	}
}
