import {
	type IncomingMessage,
	STATUS_CODES,
	type ServerResponse,
	createServer,
} from "node:http";
import path from "node:path";
import { parse } from "node:url";

import nunjucks from "nunjucks";
import queryString from "query-string";
import getRawBody from "raw-body";

import type { Application } from "../application.js";
import type { Handler } from "../handler.js";
import type { HttpContext } from "../http-context.js";
import type { Middleware } from "../middleware.js";
import type { Resource } from "../resource.js";
import { ScreamHttpContext } from "./scream-http-context.js";

export class ScreamApplication implements Application {
	readonly #routes = new Map<string, Map<string, Handler>>();

	readonly #nunjucks = new nunjucks.Environment(
		new nunjucks.FileSystemLoader(path.join(process.cwd(), "views"), {
			noCache: process.env["NODE_ENV"] !== "production",
			watch: process.env["NODE_ENV"] !== "production",
		}),
	).addGlobal("viteScripts", () => {
		return `
				<link rel="stylesheet" href="http://localhost:5173/styles.scss">
				<script type="module" src="http://localhost:5173/main.ts"></script>
				<script type="module" src="http://localhost:5173/@vite/client"></script>

			`;
	});

	#middleware: readonly Middleware[] = [];

	use(middleware: Middleware) {
		this.#middleware = [...this.#middleware, middleware];
		return this;
	}

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

	patch(path: string, handler: Handler) {
		return this.#registerRoute("PATCH", path, handler);
	}

	delete(path: string, handler: Handler) {
		return this.#registerRoute("DELETE", path, handler);
	}

	resource(path: string, resource: Resource) {
		this.get(`${path}`, resource.index.bind(resource));
		this.get(`${path}/:id`, resource.show.bind(resource));
		this.get(`${path}/create`, resource.create.bind(resource));
		this.get(`${path}/:id/edit`, resource.edit.bind(resource));

		this.post(`${path}`, resource.store.bind(resource));
		this.patch(`${path}/:id`, resource.update.bind(resource));
		this.delete(`${path}/:id`, resource.delete.bind(resource));
		return this;
	}

	async #handleRequest(req: IncomingMessage, res: ServerResponse) {
		const parsedUrl = parse(req.url ?? "", true);
		const path = parsedUrl.pathname ?? "/";
		const method = req.method ?? "GET";

		const buffer = await getRawBody(req, {
			encoding: "utf-8",
			limit: "1mb",
		});

		const body: Record<string, unknown> = queryString.parse(buffer, {
			parseBooleans: true,
			parseNumbers: true,
		});

		const context: HttpContext = new ScreamHttpContext(
			req,
			res,
			body,
			this.#nunjucks,
		);

		for (const mw of this.#middleware) {
			await mw(context);
		}

		const methodRoutes = this.#routes.get(method);
		const handler = methodRoutes?.get(path);

		if (!handler) {
			return context.notFound();
		}

		return handler(context);
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
