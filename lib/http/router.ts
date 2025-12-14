import type { Resource } from "@scream.js/http/resource.js";
import type { Handler } from "./handler.js";

export interface Router {
	get(path: string, handler: Handler): this;
	post(path: string, handler: Handler): this;

	resource(path: string, resource: Readonly<Resource>): this;
}
