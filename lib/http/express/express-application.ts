import { callbackify } from "node:util";

import type Express from "express";
import { Router } from "express";

import type { Resource } from "@scream.js/http/resource.js";
import type { Application } from "../application.js";
import type { Handler } from "../handler.js";
import type { Middleware } from "../middleware.js";
import { ExpressHttpContext } from "./express-http-context.js";

export class ExpressApp implements Application {
	readonly #express: Express.Application;

	constructor(express: Express.Application) {
		this.#express = express;
	}

	get(path: string, handler: Handler) {
		this.#express.get(path, (req, res, next) =>
			handler(new ExpressHttpContext(req, res, next)),
		);

		return this;
	}

	post(path: string, handler: Handler) {
		this.#express.post(path, (req, res, next) =>
			handler(new ExpressHttpContext(req, res, next)),
		);

		return this;
	}

	patch(path: string, handler: Handler) {
		this.#express.patch(path, (req, res, next) =>
			handler(new ExpressHttpContext(req, res, next)),
		);

		return this;
	}

	delete(path: string, handler: Handler) {
		this.#express.delete(path, (req, res, next) =>
			handler(new ExpressHttpContext(req, res, next)),
		);

		return this;
	}

	listen(port: number, cb?: () => void) {
		return this.#express.listen(port, cb);
	}

	use(middleware: Middleware) {
		this.#express.use((req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);

			callbackify(middleware)(context, next);
		});

		return this;
	}

	resource(path: string, resource: Readonly<Resource>) {
		const router = Router();

		router.get("/", (req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);
			callbackify(resource.index.bind(resource))(context, next);
		});

		router.get("/create", (req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);
			callbackify(resource.create.bind(resource))(context, next);
		});

		router.get("/:id/edit", (req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);
			callbackify(resource.edit.bind(resource))(context, next);
		});

		router.get("/:id", (req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);
			callbackify(resource.show.bind(resource))(context, next);
		});

		router.post("/", (req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);
			callbackify(resource.store.bind(resource))(context, next);
		});

		router.patch("/:id", (req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);
			callbackify(resource.update.bind(resource))(context, next);
		});

		router.delete("/:id", (req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);
			callbackify(resource.delete.bind(resource))(context, next);
		});

		this.#express.use(path, router);

		return this;
	}
}
