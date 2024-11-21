import { STATUS_CODES } from "node:http";
import type express from "express";
import type { NextFunction } from "express";
import type { HttpContext } from "../http-context.js";

export class ExpressHttpContext<Body = object> implements HttpContext<Body> {
	readonly #request: express.Request<object, object, Body>;
	readonly #response: express.Response;
	readonly #next: NextFunction;

	constructor(
		request: express.Request<object, object, Body>,
		response: express.Response,
		next: NextFunction,
	) {
		this.#request = request;
		this.#response = response;
		this.#next = next;
	}

	get body() {
		return { ...this.#request.body };
	}

	get params() {
		return { ...this.#request.params };
	}

	get method() {
		return this.#request.method;
	}

	get headers() {
		return this.#request.headers;
	}

	get url() {
		return this.#request.url;
	}

	json(data: object) {
		this.#response.json(data);
	}

	end(chunk?: unknown) {
		this.#response.end(chunk);
	}

	status(code: number) {
		this.#response.status(code);
		return this;
	}

	render(template: string, locals = {}) {
		return new Promise<void>((resolve, reject) => {
			try {
				return resolve(this.#response.render(template, locals));
			} catch (error) {
				if (error instanceof Error) {
					return reject(error);
				}
			}
		});
	}

	location(url: string) {
		this.#response.location(url);
	}

	redirect(url: string) {
		this.#response.redirect(url);
	}

	back() {
		this.#response.redirect("back");
	}

	text(message: string) {
		this.#response.setHeader("Content-Type", "text/plain");
		this.end(message);
	}

	acceptsLanguages(languages: string[]) {
		return this.#request.acceptsLanguages(languages) || "en-US";
	}

	onClose(cb: () => void) {
		this.#request.on("close", cb);
	}

	onError(cb: () => void) {
		this.#request.on("error", cb);
	}

	hasHeader(header: string) {
		return !!this.#request.header(header);
	}

	notFound() {
		this.#response.status(404).end(STATUS_CODES[404]);
	}

	internalServerError(message: string) {
		this.status(500).text(message);
	}

	handleError(error: unknown) {
		this.#next(error);
	}
}
