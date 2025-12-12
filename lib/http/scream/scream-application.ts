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
import type { Middleware } from "../middleware.js";
import type { Resource } from "../resource.js";
import { ScreamHttpContext } from "./scream-http-context.js";

export class ScreamApp implements Application {
	readonly #routes = new Map<string, Map<string, Handler>>(); // Method -> Path -> Handler

	#middleware: readonly Middleware[] = [];

	// Middleware registration
	use(middleware: Middleware) {
		this.#middleware = [...this.#middleware, middleware];
		return this;
	}

	// Register routes based on HTTP method
	private registerRoute(method: string, path: string, handler: Handler) {
		if (!this.#routes.has(method)) {
			this.#routes.set(method, new Map());
		}
		this.#routes.get(method)?.set(path, handler);
		return this;
	}

	get(path: string, handler: Handler) {
		return this.registerRoute("GET", path, handler);
	}

	post(path: string, handler: Handler) {
		return this.registerRoute("POST", path, handler);
	}

	patch(path: string, handler: Handler) {
		return this.registerRoute("PATCH", path, handler);
	}

	delete(path: string, handler: Handler) {
		return this.registerRoute("DELETE", path, handler);
	}

	// Resource method for CRUD-like routes
	resource(path: string, resource: Readonly<Resource>) {
		this.get(`${path}`, resource.index.bind(resource));
		this.get(`${path}/create`, resource.create.bind(resource));
		this.post(`${path}`, resource.store.bind(resource));
		this.get(`${path}/:id`, resource.show.bind(resource));
		this.get(`${path}/:id/edit`, resource.edit.bind(resource));
		this.patch(`${path}/:id`, resource.update.bind(resource));
		this.delete(`${path}/:id`, resource.delete.bind(resource));
		return this;
	}

	// Handle incoming requests, run middleware and route to correct handler
	private async handleRequest(req: IncomingMessage, res: ServerResponse) {
		const context: HttpContext = new ScreamHttpContext(req, res); // Our HttpContext implementation
		const parsedUrl = parse(req.url || "", true);
		const path = parsedUrl.pathname || "/";
		const method = req.method || "GET";

		// Run middleware stack
		for (const mw of this.#middleware) {
			await mw(context);
		}

		// Match route and run the handler
		const methodRoutes = this.#routes.get(method);
		const handler = methodRoutes ? methodRoutes.get(path) : undefined;

		if (handler) {
			await handler(context);
		} else {
			context.notFound();
		}
	}

	// Start the HTTP server and listen on a port
	listen(port: number, cb?: () => void) {
		const server = createServer(async (req, res) => {
			try {
				await this.handleRequest(req, res);
			} catch (err) {
				console.error("Error handling request:", err);

				res.writeHead(500, STATUS_CODES[500]).end(STATUS_CODES[500]);
			}
		});

		return server.listen(port, cb);
	}
}
