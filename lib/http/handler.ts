import type { HttpContext } from "./http-context.js";

export type Handler = (context: HttpContext) => unknown;
