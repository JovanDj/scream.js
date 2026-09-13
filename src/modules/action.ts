import type { HttpContext } from "@scream.js/http/http-context.js";

export interface Action {
	handle(ctx: HttpContext): Promise<void>;
}
