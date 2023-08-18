import { HTTPContext } from "../http/http-context.js";

export interface Router {
  get(path: string, handler: (context: HTTPContext) => unknown): void;
  post(path: string, handler: (context: HTTPContext) => unknown): void;
}
