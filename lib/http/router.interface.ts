import { Resource } from "resource.js";
import { Handler } from "./handler.js";

export interface Router {
  get(path: string, handler: Handler): void;
  post(path: string, handler: Handler): void;
  patch(path: string, handler: Handler): void;
  delete(path: string, handler: Handler): void;
  resource(path: string, resource: Resource): void;
}
