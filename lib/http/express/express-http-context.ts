import { STATUS_CODES } from "node:http";
import type express from "express";
import type { HttpContext } from "../http-context.js";

export class ExpressHttpContext implements HttpContext {
	readonly #request: express.Request;
	readonly #response: express.Response;

	static create(request: express.Request, response: express.Response) {
		return new ExpressHttpContext(request, response);
	}

	constructor(request: express.Request, response: express.Response) {
		this.#request = request;
		this.#response = response;
	}

	render(template: string, locals = {}) {
		return new Promise<void>((resolve, reject) => {
			this.#response.render(
				template,
				{ lang: "en", ...locals },
				(err, html) => {
					if (err) {
						return reject(err);
					}
					this.#response.send(html);
					resolve();
				},
			);
		});
	}

	redirect(url: string) {
		this.#response.redirect(url);
	}

	notFound() {
		this.#response.status(404).end(STATUS_CODES[404]);
	}

	param(key: string) {
		return this.#request.params[key];
	}

	body() {
		return this.#request.body;
	}

	query() {
		return this.#request.query;
	}
}
