import { STATUS_CODES } from "node:http";
import type express from "express";
import { z } from "zod/v4";
import type { HttpContext } from "../http-context.js";

export class ExpressHttpContext implements HttpContext {
	readonly #request: express.Request;
	readonly #response: express.Response;

	constructor(request: express.Request, response: express.Response) {
		this.#request = request;
		this.#response = response;
	}

	render(template: string, locals = {}) {
		return new Promise<void>((resolve, reject) => {
			this.#response.render(template, locals, (err, html) => {
				if (err) {
					return reject(err);
				}
				this.#response.send(html);
				resolve();
			});
		});
	}

	redirect(url: string) {
		this.#response.redirect(url);
	}

	unprocessableEntity(body?: string) {
		this.#response.status(422);
		if (body) {
			this.#response.end(body);
		}
	}

	notFound() {
		this.#response.status(404).end(STATUS_CODES[404]);
	}

	param<S extends z.ZodType>(key: string, schema: (zod: typeof z) => S) {
		return schema(z).safeParse(this.#request.params[key]);
	}

	body<S extends z.ZodType>(schema: (zod: typeof z) => S) {
		return schema(z).safeParse(this.#request.body);
	}

	query<S extends z.ZodType>(schema: (zod: typeof z) => S) {
		return schema(z).safeParse(this.#request.query);
	}
}
