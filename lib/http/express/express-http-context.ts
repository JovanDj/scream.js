import { STATUS_CODES } from "node:http";

import type express from "express";

import type { Validator } from "@scream.js/validator/validator.js";
import type { HttpContext } from "../http-context.js";

export class ExpressHttpContext implements HttpContext {
	readonly #request: express.Request;
	readonly #response: express.Response;
	readonly #next: express.NextFunction;

	constructor(
		request: express.Request,
		response: express.Response,
		next: express.NextFunction,
	) {
		this.#request = request;
		this.#response = response;
		this.#next = next;
	}

	body() {
		return { ...this.#request.body };
	}

	params() {
		return { ...this.#request.params };
	}

	param(key: string) {
		return this.params()[key] ?? "";
	}

	method() {
		return this.#request.method;
	}

	headers() {
		return this.#request.headers;
	}

	url() {
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

	async render(template: string, locals = {}) {
		return this.#response.render(template, locals);
	}

	location(url: string) {
		this.#response.location(url);
	}

	redirect(url: string) {
		this.#response.redirect(url);
	}

	back() {
		this.#response.redirect(this.#request.get("Referrer") ?? "/");
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

	validate<T>(validator: Validator<T>) {
		return validator.validate(this.body());
	}
}
