import type { Request } from "./request.js";
import type { Response } from "./response.js";

export interface HttpContext extends Request, Response {
	notFound(): void;
	status(code: number): this;
	handleError(error: unknown): void;
	text(message: string): void;
	internalServerError(message: string): void;
}
