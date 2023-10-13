import { Handler } from "../http/handler.js";

export interface Router {
  get(path: string, handler: Handler): void;
  post(path: string, handler: Handler): void;
}
