import type Koa from "koa";
import type { HttpContext } from "../http-context.js";

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

	param(key: string) {
		return this.#paramValue(key);
	}

	body() {
		return this.#body();
	}

	query() {
		return this.#query();
	}
}
