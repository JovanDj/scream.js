import { DestroyController } from "@scream.js/http/controllers/destroy.controller.js";
import { type TagShowInput, tagShowInputSchema } from "./tag.schema.js";

export class TagDestroyController extends DestroyController<TagShowInput> {
	protected inputSchema() {
		return tagShowInputSchema;
	}

	protected redirectUrl() {
		return "/tags";
	}
}
