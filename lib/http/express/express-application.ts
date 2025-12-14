import type Express from "express";

import type { Application } from "../application.js";
import type { Handler } from "../handler.js";
import type { Resource } from "../resource.ts";
import { ExpressHttpContext } from "./express-http-context.js";

export class ExpressApp implements Application {
	readonly #express: Express.Application;

	constructor(express: Express.Application) {
		this.#express = express;
	}

	get(path: string, handler: Handler) {
		this.#express.get(path, (req, res) =>
			handler(new ExpressHttpContext(req, res)),
		);

		return this;
	}

	post(path: string, handler: Handler) {
		this.#express.post(path, (req, res) =>
			handler(new ExpressHttpContext(req, res)),
		);

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
