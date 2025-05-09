import type Koa from "koa";
import type { HttpContext } from "../http-context.js";

export class KoaHttpContext implements HttpContext {
	readonly #ctx: Koa.Context;

	constructor(ctx: Koa.Context) {
		this.#ctx = ctx;
	}

	params(param: string) {
		return this.#ctx[param];
	}

	body() {
		return this.#ctx.body;
	}

	method() {
		return this.#ctx.method;
	}

	headers() {
		return this.#ctx.headers;
	}

	url() {
		return this.#ctx.url;
	}

	onClose(cb: () => void) {
		this.#ctx.res.on("close", cb);
	}

	hasHeader(header: string) {
		return !!this.#ctx.headers[header.toLowerCase()];
	}

	acceptsLanguages(languages: string[]) {
		return this.#ctx.acceptsLanguages(...languages) || "";
	}

	json(data: object) {
		this.#ctx.body = data;
	}

	end(chunk?: unknown) {
		this.#ctx.res.end(chunk);
	}

	status(code: number) {
		this.#ctx.status = code;
		return this;
	}

	async render(template: string, locals?: Record<string, unknown>) {
		return this.#ctx.render(template, locals);
	}

	location(url: string) {
		this.#ctx.set("Location", url);
	}

	redirect(url: string) {
		this.#ctx.redirect(url);
	}

	back() {
		const referrer = this.#ctx.headers.referer || "/";
		this.#ctx.redirect(referrer);
	}

	text(message: string): void {
		this.#ctx.body = message;
		this.#ctx.type = "text/plain";
	}

	id() {
		const idParam = this.params("id");
		return idParam ? Number.parseInt(idParam, 10) : undefined;
	}

	notFound() {
		this.status(404).end();
	}

	handleError(error: unknown) {
		this.#ctx.app.emit("error", error, this.#ctx);
	}

	internalServerError(message: string) {
		this.status(500).end(message);
	}
}
