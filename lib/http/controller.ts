import type { HttpContext } from "./http-context.js";

export interface Controller {
	handle(ctx: HttpContext): Promise<void>;
}
