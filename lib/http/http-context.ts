import type { Request } from "./request.js";
import type { Response } from "./response.js";

export interface HttpContext<Body = object> extends Request<Body>, Response {
  id: number | undefined;
  notFound(): void;
  status(code: number): HttpContext;
  handleError(error: unknown): void;
  text(message: string): void;
}
