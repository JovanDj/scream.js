import path from "node:path";
import { Evaluator } from "@scream.js/template-engine/evaluator.js";
import { Generator } from "@scream.js/template-engine/generator.js";
import { Parser } from "@scream.js/template-engine/parser.js";
import { Resolver } from "@scream.js/template-engine/resolver.js";
import { SystemFileLoader } from "@scream.js/template-engine/system-file-loader.js";
import { ScreamTemplateEngine } from "@scream.js/template-engine/template-engine.js";
import { Tokenizer } from "@scream.js/template-engine/tokenizer.js";
import { Transformer } from "@scream.js/template-engine/transformer.js";
import type Express from "express";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

import type { Application } from "../application.js";
import type { Handler } from "../handler.js";
import { NotFoundError } from "../not-found-error.js";
import type { Resource } from "../resource.ts";
import { ExpressHttpContext } from "./express-http-context.js";

export class ExpressApp implements Application {
	readonly #express: Express.Application;

	static create(): Application {
		const app = express();
		const templateEngine = new ScreamTemplateEngine(
			new Resolver(
				new SystemFileLoader(),
				new Tokenizer(),
				new Parser(),
				new Transformer(),
			),
			new Evaluator(),
			new Generator(),
		);

		const viewsPath = path.join(process.cwd(), "views");

		app.engine("njk", async (filePath, options, callback) => {
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
		app.set("view engine", "njk");

		app.use(express.urlencoded({ extended: true }));
		app.use(express.static(path.join(process.cwd(), "resources")));

		app.use(
			"/assets",
			createProxyMiddleware({
				changeOrigin: true,
				target: "http://localhost:5173",
			}),
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
				if (error instanceof NotFoundError) {
					return;
				}
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
				if (error instanceof NotFoundError) {
					return;
				}
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
			.post(`${path}/create`, (ctx) => resource.store(ctx))
			.get(`${path}/:id/edit`, (ctx) => resource.edit(ctx))
			.get(`${path}/:id`, (ctx) => resource.show(ctx))
			.post(`${path}/:id/edit`, (ctx) => resource.update(ctx))
			.post(`${path}/:id/delete`, (ctx) => resource.delete(ctx));
	}
}
