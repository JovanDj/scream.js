import type Koa from "koa";
import { z } from "zod/v4";
import type { HttpContext } from "../http-context.js";

export class KoaHttpContext implements HttpContext {
	readonly #ctx: Koa.Context;

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

	unprocessableEntity(body?: string) {
		this.#status(422);
		if (body) {
			this.#end(body);
		}
	}

	notFound() {
		this.#status(404).#end("Not Found");
	}

	param<S extends z.ZodType>(key: string, schema: (zod: typeof z) => S) {
		return schema(z).safeParse(this.#paramValue(key));
	}

	body<S extends z.ZodType>(schema: (zod: typeof z) => S) {
		return schema(z).safeParse(this.#body());
	}

	query<S extends z.ZodType>(schema: (zod: typeof z) => S) {
		return schema(z).safeParse(this.#query());
	}
}
