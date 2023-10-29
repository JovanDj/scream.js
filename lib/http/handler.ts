import { HttpContext } from "./http-context.js";

export type Handler = (context: HttpContext) => unknown;
