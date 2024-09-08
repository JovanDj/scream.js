import type { Resource } from "@scream.js/resource.js";
import type { Handler } from "./handler.js";

export interface Router {
	get(path: string, handler: Handler): this;
	post(path: string, handler: Handler): this;
	patch(path: string, handler: Handler): this;
	delete(path: string, handler: Handler): this;
	resource(path: string, resource: Resource): this;
}
