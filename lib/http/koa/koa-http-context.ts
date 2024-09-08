import type Koa from "koa";
import type { HttpContext } from "../http-context.js";

export class KoaHttpContext<Body = object> implements HttpContext<Body> {
	constructor(private readonly ctx: Koa.Context) {}

	get params() {
		return this.ctx["params"];
	}

	get body() {
		return this.ctx.body as Body;
	}

	get method() {
		return this.ctx.method;
	}

	get headers() {
		return this.ctx.headers;
	}

	get url() {
		return this.ctx.url;
	}

	onClose(cb: () => void) {
		this.ctx.res.on("close", cb);
	}

	hasHeader(header: string) {
		return !!this.ctx.headers[header.toLowerCase()];
	}

	acceptsLanguages(languages: string[]) {
		return this.ctx.acceptsLanguages(...languages) || "";
	}

	json(data: object) {
		this.ctx.body = data;
	}

	end(chunk?: unknown) {
		this.ctx.res.end(chunk);
	}

	status(code: number) {
		this.ctx.status = code;
		return this;
	}

	async render(template: string, locals?: Record<string, unknown>) {
		return this.ctx.render(template, locals);
	}

	location(url: string) {
		this.ctx.set("Location", url);
	}

	redirect(url: string) {
		this.ctx.redirect(url);
	}

	back() {
		const referrer = this.ctx.headers.referer || "/";
		this.ctx.redirect(referrer);
	}

	text(message: string): void {
		this.ctx.body = message;
		this.ctx.type = "text/plain";
	}

	get id() {
		const idParam = this.params["id"];
		return idParam ? Number.parseInt(idParam, 10) : undefined;
	}

	notFound() {
		this.status(404).end();
	}

	handleError(error: unknown) {
		this.ctx.app.emit("error", error, this.ctx);
	}
}
