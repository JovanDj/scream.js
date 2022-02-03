import { HTTPContext } from "./http/http-context";

export interface Middleware {
  next?: Middleware;
  handle(context: HTTPContext): void;
}
