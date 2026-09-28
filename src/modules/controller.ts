import type { HttpContext } from "@scream.js/http/http-context.js";

export interface Controller {
	handle(ctx: HttpContext): Promise<void>;
}
