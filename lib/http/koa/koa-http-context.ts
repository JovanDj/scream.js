import type { Validator } from "@scream.js/validator/validator.js";
import type Koa from "koa";
import type { HttpContext } from "../http-context.js";
import { NotFoundError } from "../not-found-error.js";

export class KoaHttpContext implements HttpContext {
	readonly #ctx: Koa.Context;

	static create(ctx: Koa.Context) {
		return new KoaHttpContext(ctx);
	}

	constructor(ctx: Koa.Context) {
		this.#ctx = ctx;
	}

	params() {
		return this.#ctx["params"];
	}

	#paramValue(key: string) {
		return this.params()[key] ?? "";
	}

	#body() {
		return this.#ctx.request.body;
	}

	#query() {
		return this.#ctx.query;
	}

	#end(chunk?: unknown) {
		this.#ctx.res.end(chunk);
	}

	#status(code: number) {
		this.#ctx.status = code;
		return this;
	}

	async render(template: string, locals?: Record<string, unknown>) {
		return this.#ctx.render(template, locals);
	}

	redirect(url: string) {
		this.#ctx.redirect(url);
	}

	notFound() {
		this.#status(404).#end("Not Found");
	}

	param<T>(key: string, validator: Validator<T>) {
		const result = validator.validate(this.#paramValue(key));
		if (result.success) {
			return result.data;
		}

		this.notFound();
		throw new NotFoundError();
	}

	body<T>(validator: Validator<T>) {
		return validator.validate(this.#body());
	}

	query<T>(validator: Validator<T>) {
		return validator.validate(this.#query());
	}
}
