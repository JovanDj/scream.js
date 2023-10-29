import { HttpContext } from "./http/http-context.js";

export interface Middleware {
  next?: Middleware;
  handle(context: HttpContext): void;
}
