import { HTTPContext } from "./http/http-context.js";

export interface Middleware {
  next?: Middleware;
  handle(context: HTTPContext): void;
}
