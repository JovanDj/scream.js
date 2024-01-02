import { HttpContext } from "./http-context.js";

export type Middleware = (ctx: HttpContext) => void;
