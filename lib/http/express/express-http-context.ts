import { STATUS_CODES } from "node:http";
import type { Validator } from "@scream.js/validator/validator.js";
import type express from "express";
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

	validateParam<T>(key: string, validator: Validator<T>) {
		return validator.validate(this.#request.params[key]);
	}

	validateBody<T>(validator: Validator<T>) {
		return validator.validate(this.#request.body);
	}

	validateQuery<T>(validator: Validator<T>) {
		return validator.validate(this.#request.query);
	}
}
