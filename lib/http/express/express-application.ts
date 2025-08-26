import type Express from "express";
import { Router } from "express";

import type { Application } from "../application.js";
import type { Handler } from "../handler.js";
import type { Middleware } from "../middleware.js";
import type { Resource } from "../resource.ts";

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
		this.#express.use((req, res, next) =>
			middleware(new ExpressHttpContext(req, res, next)),
		);

		return this;
	}

	resource(path: string, resource: Readonly<Resource>) {
		const router = Router();

		router.get("/", (req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);
			resource.index(context);
		});

		router.get("/create", (req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);
			resource.create(context);
		});

		router.post("/create", (req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);
			resource.store(context);
		});

		router.get("/:id/edit", (req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);
			resource.edit(context);
		});

		router.get("/:id", (req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);
			resource.show(context);
		});

		router.patch("/:id", (req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);
			resource.update(context);
		});

		router.delete("/:id", (req, res, next) => {
			const context = new ExpressHttpContext(req, res, next);
			resource.delete(context);
		});

		this.#express.use(path, router);

		return this;
	}
}
