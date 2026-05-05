import path from "node:path";
import { ScreamTemplateEngine } from "@scream.js/template-engine/template-engine.js";
import type Express from "express";
import express from "express";
import methodOverride from "method-override";
import type { Application } from "../application.js";
import type { Handler } from "../handler.js";
import type { Resource } from "../resource.ts";
import { ExpressHttpContext } from "./express-http-context.js";

export class ExpressApp implements Application {
	readonly #express: Express.Application;

	static create(): Application {
		const app = express();
		const templateEngine = ScreamTemplateEngine.create();

		const viewsPath = path.join(process.cwd(), "views");

		app.engine("scream", async (filePath, options, callback) => {
			try {
				const rendered = await templateEngine.compileFile(filePath, {
					...options,
				});
				callback(null, rendered);
			} catch (err) {
				callback(err);
			}
		});

		app.set("views", viewsPath);
		app.set("view engine", "scream");

		app.use(express.urlencoded({ extended: true }));
		app.use(
			methodOverride(
				(req) => {
					if (!req.body || typeof req.body !== "object") {
						return "";
					}

					const method = String(req.body["_method"] ?? "").toUpperCase();
					delete req.body["_method"];

					if (method === "PATCH" || method === "DELETE") {
						return method;
					}

					return "";
				},
				{ methods: ["POST"] },
			),
		);

		return new ExpressApp(app);
	}

	constructor(express: Express.Application) {
		this.#express = express;
	}

	get(path: string, handler: Handler) {
		this.#express.get(path, async (req, res, next) => {
			try {
				await handler(ExpressHttpContext.create(req, res));
			} catch (error) {
				next(error);
			}
		});

		return this;
	}

	post(path: string, handler: Handler) {
		this.#express.post(path, async (req, res, next) => {
			try {
				await handler(ExpressHttpContext.create(req, res));
			} catch (error) {
				next(error);
			}
		});

		return this;
	}

	patch(path: string, handler: Handler) {
		this.#express.patch(path, async (req, res, next) => {
			try {
				await handler(ExpressHttpContext.create(req, res));
			} catch (error) {
				next(error);
			}
		});

		return this;
	}

	delete(path: string, handler: Handler) {
		this.#express.delete(path, async (req, res, next) => {
			try {
				await handler(ExpressHttpContext.create(req, res));
			} catch (error) {
				next(error);
			}
		});

		return this;
	}

	listen(port: number, cb?: () => void) {
		return this.#express.listen(port, cb);
	}

	resource(path: string, resource: Readonly<Resource>) {
		return this.get(path, (ctx) => resource.index(ctx))
			.get(`${path}/create`, (ctx) => resource.create(ctx))
			.post(path, (ctx) => resource.store(ctx))
			.get(`${path}/:id/edit`, (ctx) => resource.edit(ctx))
			.get(`${path}/:id`, (ctx) => resource.show(ctx))
			.patch(`${path}/:id`, (ctx) => resource.update(ctx))
			.delete(`${path}/:id`, (ctx) => resource.destroy(ctx));
	}
}
