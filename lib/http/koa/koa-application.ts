import path from "node:path";
import { bodyParser } from "@koa/bodyparser";
import Router from "@koa/router";
import { ScreamTemplateEngine } from "@scream.js/template-engine/template-engine.js";
import type Koa from "koa";
import KoaClass from "koa";
import methodOverride from "koa-override";

import type { Application } from "../application.js";
import type { Handler } from "../handler.js";
import type { Resource } from "../resource.js";
import { KoaHttpContext } from "./koa-http-context.js";

declare module "koa" {
	interface DefaultContext {
		render: (view: string, locals?: Record<string, unknown>) => Promise<void>;
	}
}

export class KoaApp implements Application {
	readonly #koa: Koa;
	readonly #router: Router;

	static create(): Application {
		const koa = new KoaClass();
		const viewsPath = path.join(process.cwd(), "views");
		const templateEngine = ScreamTemplateEngine.create();

		koa.use(bodyParser());
		koa.use(async (ctx, next) => {
			const body = ctx.request.body;
			if (ctx.method === "POST" && body && typeof body === "object") {
				const method = String(
					(body as Record<string, unknown>)["_method"] ?? "",
				).toUpperCase();
				if (method && method !== "PATCH" && method !== "DELETE") {
					delete (body as Record<string, unknown>)["_method"];
				}
			}
			ctx.request.headers["x-http-method-override"] = "";
			await next();
		});
		koa.use(methodOverride({ allowedMethods: ["POST"] }));
		koa.use(async (ctx, next) => {
			const body = ctx.request.body;
			if (body && typeof body === "object") {
				delete (body as Record<string, unknown>)["_method"];
			}
			await next();
		});

		koa.use(async (ctx, next) => {
			ctx.render = async (view, locals = {}) => {
				const filename = path.extname(view) ? view : `${view}.scream`;
				const data = { ...ctx.state, ...locals };
				const html = await templateEngine.compileFile(
					path.join(viewsPath, filename),
					data,
				);

				ctx.type = "text/html; charset=utf-8";
				ctx.body = html;
			};
			await next();
		});

		return new KoaApp(koa, new Router());
	}

	constructor(koa: Koa, router: Router) {
		this.#koa = koa;
		this.#router = router;
	}

	get(path: string, handler: Handler) {
		this.#router.get(path, async (ctx) => {
			const context = this.#createContext(ctx);
			await handler(context);
		});
		return this;
	}

	post(path: string, handler: Handler) {
		this.#router.post(path, async (ctx) => {
			const context = this.#createContext(ctx);
			await handler(context);
		});
		return this;
	}

	patch(path: string, handler: Handler) {
		this.#router.patch(path, async (ctx) => {
			const context = this.#createContext(ctx);
			await handler(context);
		});
		return this;
	}

	delete(path: string, handler: Handler) {
		this.#router.delete(path, async (ctx) => {
			const context = this.#createContext(ctx);
			await handler(context);
		});
		return this;
	}

	resource(path: string, resource: Resource) {
		const router = new Router({ prefix: path });

		router.get("/", (ctx) => resource.index(this.#createContext(ctx)));

		router.get("/create", (ctx) => resource.create(this.#createContext(ctx)));

		router.post("/", (ctx) => resource.store(this.#createContext(ctx)));

		router.get("/:id/edit", (ctx) => resource.edit(this.#createContext(ctx)));

		router.get("/:id", (ctx) => resource.show(this.#createContext(ctx)));

		router.patch("/:id", (ctx) => resource.update(this.#createContext(ctx)));

		router.delete("/:id", (ctx) => resource.destroy(this.#createContext(ctx)));

		this.#router.use(router.routes());

		return this;
	}

	#createContext(ctx: Koa.ParameterizedContext) {
		return KoaHttpContext.create(ctx);
	}

	listen(port: number, cb?: () => void) {
		this.#koa.use(this.#router.routes());

		return this.#koa.listen(port, cb);
	}
}
