import type { Validator } from "@scream.js/validator/validator.js";
import type Koa from "koa";
import type { HttpContext } from "../http-context.js";

export class KoaHttpContext implements HttpContext {
	readonly #ctx: Koa.Context;

	constructor(ctx: Koa.Context) {
		this.#ctx = ctx;
	}

	param(key: string) {
		return this.params()[key] ?? "";
	}

	params() {
		return this.#ctx["params"];
	}

	#body() {
		return this.#ctx.request.body;
	}

	acceptsLanguages(languages: string[]) {
		return this.#ctx.acceptsLanguages(...languages) || "";
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

	validate<T>(validator: Validator<T>) {
		return validator.validate(this.#body());
	}
}
