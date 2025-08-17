import Router from "@koa/router";
import type Koa from "koa";

import type { Application } from "../application.js";
import type { Handler } from "../handler.js";
import type { Middleware } from "../middleware.js";
import type { Resource } from "../resource.js";
import { KoaHttpContext } from "./koa-http-context.js";

export class KoaApp implements Application {
	readonly #koa: Koa;
	readonly #router: Router;

	constructor(koa: Koa, router: Router) {
		this.#koa = koa;
		this.#router = router;
	}

	get(path: string, handler: Handler) {
		this.#router.get(path, async (ctx) => handler(this.#createContext(ctx)));
		return this;
	}

	post(path: string, handler: Handler) {
		this.#router.post(path, async (ctx) => handler(this.#createContext(ctx)));
		return this;
	}

	patch(path: string, handler: Handler) {
		this.#router.patch(path, async (ctx) => handler(this.#createContext(ctx)));
		return this;
	}

	delete(path: string, handler: Handler) {
		this.#router.delete(path, async (ctx) => handler(this.#createContext(ctx)));
		return this;
	}

	resource(path: string, resource: Resource) {
		const router = new Router({ prefix: path });

		router.get("/", async (ctx) => {
			const context = this.#createContext(ctx);
			await resource.index(context);
		});

		router.get("/create", async (ctx) => {
			const context = this.#createContext(ctx);
			await resource.create(context);
		});

		router.post("/create", async (ctx) => {
			const context = this.#createContext(ctx);
			await resource.store(context);
		});

		router.get("/:id/edit", async (ctx) => {
			const context = this.#createContext(ctx);
			await resource.edit(context);
		});

		router.get("/:id", async (ctx) => {
			const context = this.#createContext(ctx);
			await resource.show(context);
		});

		router.patch("/:id", async (ctx) => {
			const context = this.#createContext(ctx);
			await resource.update(context);
		});

		router.delete("/:id", async (ctx) => {
			const context = this.#createContext(ctx);
			await resource.delete(context);
		});

		this.#router.use(router.routes());
		this.#router.use(router.allowedMethods());

		return this;
	}

	#createContext(ctx: Koa.ParameterizedContext) {
		return new KoaHttpContext(ctx);
	}

	listen(port: number, cb?: () => void) {
		this.#koa.use(this.#router.routes());
		this.#koa.use(this.#router.allowedMethods());

		return this.#koa.listen(port, cb);
	}

	use(middleware: Middleware) {
		this.#koa.use(async (ctx, next) => {
			const context = this.#createContext(ctx);
			await middleware(context);
			await next();
		});

		return this;
	}
}
