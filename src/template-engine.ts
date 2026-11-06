import {
	ScreamTemplateEngine,
	TemplateGroupFileLoader,
} from "@scream.js/template-engine/template-engine.js";
import { schema } from "@scream.js/validator/schema.js";

export function createTemplateEngine(skin = "default") {
	const selection = schema.enum(["default", "compact"]).safeParse(skin);

	if (!selection.success) {
		throw new Error(
			`Invalid SCREAM_SKIN ${JSON.stringify(skin)}. Expected "default" or "compact".`,
		);
	}

	return ScreamTemplateEngine.create(
		new TemplateGroupFileLoader({
			groups:
				selection.data === "compact" ? ["compact", "default"] : ["default"],
		}),
	);
}
