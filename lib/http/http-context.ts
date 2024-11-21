import type { Request } from "./request.js";
import type { Response } from "./response.js";

export interface HttpContext<Body = object> extends Request<Body>, Response {
	notFound(): void;
	status(code: number): this;
	handleError(error: unknown): void;
	text(message: string): void;
	internalServerError(message: string): void;
}
