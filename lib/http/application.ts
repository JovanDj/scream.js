import type { Server } from "node:http";
import type { Handler } from "./handler.js";
import type { Resource } from "./resource.js";

export interface Application {
	get(path: string, handler: Handler): this;
	post(path: string, handler: Handler): this;
	patch(path: string, handler: Handler): this;
	delete(path: string, handler: Handler): this;
	resource(path: string, resource: Readonly<Resource>): this;
	listen(port: number, cb?: () => void): Server;
}
