import Router from "@koa/router";
import type Koa from "koa";

import type { Application } from "../application.js";
import type { Handler } from "../handler.js";
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
		this.#router.get(path, (ctx) => handler(this.#createContext(ctx)));
		return this;
	}

	post(path: string, handler: Handler) {
		this.#router.post(path, (ctx) => handler(this.#createContext(ctx)));
		return this;
	}

	resource(path: string, resource: Resource) {
		const router = new Router({ prefix: path });

		router.get("/", (ctx) => resource.index(this.#createContext(ctx)));

		router.get("/create", (ctx) => resource.create(this.#createContext(ctx)));

		router.post("/create", (ctx) => resource.store(this.#createContext(ctx)));

		router.get("/:id/edit", (ctx) => resource.edit(this.#createContext(ctx)));

		router.get("/:id", (ctx) => resource.show(this.#createContext(ctx)));

		router.post("/:id/edit", async (ctx) => {
			const context = this.#createContext(ctx);
			try {
				await resource.update(context);
			} catch {
				context.notFound();
			}
		});

		router.post("/:id/delete", async (ctx) => {
			const context = this.#createContext(ctx);
			try {
				await resource.delete(context);
			} catch {
				context.notFound();
			}
		});

		this.#router.use(router.routes());

		return this;
	}

	#createContext(ctx: Koa.ParameterizedContext) {
		return new KoaHttpContext(ctx);
	}

	listen(port: number, cb?: () => void) {
		this.#koa.use(this.#router.routes());

		return this.#koa.listen(port, cb);
	}
}
