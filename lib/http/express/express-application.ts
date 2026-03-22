import type { Database } from "@scream.js/database/db.js";
import type Express from "express";

import type { Application } from "../application.js";
import type { Handler } from "../handler.js";
import type { Resource } from "../resource.ts";
import { ExpressHttpContext } from "./express-http-context.js";

export class ExpressApp implements Application {
	readonly #db: Database;
	readonly #express: Express.Application;

	constructor(express: Express.Application, db: Database) {
		this.#express = express;
		this.#db = db;
	}

	get(path: string, handler: Handler) {
		this.#express.get(path, (req, res) =>
			handler(new ExpressHttpContext(req, res, this.#db)),
		);

		return this;
	}

	post(path: string, handler: Handler) {
		this.#express.post(path, (req, res) =>
			handler(new ExpressHttpContext(req, res, this.#db)),
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
