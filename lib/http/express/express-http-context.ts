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

	param<T>(key: string, validator: Validator<T>) {
		const result = validator.validate(this.#request.params[key]);
		return result.success ? result.data : undefined;
	}

	body<T>(validator: Validator<T>) {
		return validator.validate(this.#request.body);
	}

	query<T>(validator: Validator<T>) {
		return validator.validate(this.#request.query);
	}
}
