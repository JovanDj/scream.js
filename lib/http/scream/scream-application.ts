import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
	STATUS_CODES,
} from "node:http";
import { parse } from "node:url";

import type { Application } from "../application.js";
import type { Handler } from "../handler.js";
import type { HttpContext } from "../http-context.js";
import type { Resource } from "../resource.ts";
import { ScreamHttpContext } from "./scream-http-context.js";

export class ScreamApp implements Application {
	readonly #routes = new Map<string, Map<string, Handler>>();

	#registerRoute(method: string, path: string, handler: Handler) {
		if (!this.#routes.has(method)) {
			this.#routes.set(method, new Map());
		}
		this.#routes.get(method)?.set(path, handler);
		return this;
	}

	get(path: string, handler: Handler) {
		return this.#registerRoute("GET", path, handler);
	}

	post(path: string, handler: Handler) {
		return this.#registerRoute("POST", path, handler);
	}

	resource(path: string, resource: Readonly<Resource>) {
		this.get(`${path}`, async (ctx) => resource.index(ctx));
		this.get(`${path}/create`, async (ctx) => resource.create(ctx));
		this.post(`${path}`, async (ctx) => resource.store(ctx));
		this.get(`${path}/:id`, async (ctx) => resource.show(ctx));
		this.get(`${path}/:id/edit`, async (ctx) => resource.edit(ctx));
		this.post(`${path}/:id/edit`, async (ctx) => resource.update(ctx));
		this.post(`${path}/:id/delete`, async (ctx) => resource.delete(ctx));
		return this;
	}

	async #handleRequest(req: IncomingMessage, res: ServerResponse) {
		const context: HttpContext = new ScreamHttpContext(req, res);
		const parsedUrl = parse(req.url || "", true);
		const path = parsedUrl.pathname || "/";
		const method = req.method || "GET";

		const methodRoutes = this.#routes.get(method);
		const handler = methodRoutes ? methodRoutes.get(path) : undefined;

		if (handler) {
			await handler(context);
		} else {
			context.notFound();
		}
	}

	listen(port: number, cb?: () => void) {
		const server = createServer(async (req, res) => {
			try {
				await this.#handleRequest(req, res);
			} catch (err) {
				console.error("Error handling request:", err);

				res.writeHead(500, STATUS_CODES[500]).end(STATUS_CODES[500]);
			}
		});

		return server.listen(port, cb);
	}
}
