import path from "node:path";
import Router from "@koa/router";
import views from "@ladjs/koa-views";
import type { Resource } from "@scream.js/resource.js";
import type Koa from "koa";
import nunjucks from "nunjucks";
import type { Application } from "../application.interface.js";
import type { Handler } from "../handler.js";
import type { Middleware } from "../middleware.js";
import { KoaHttpContext } from "./koa-http-context.js";

const viewsPath = path.join(process.cwd(), "views");
const nunjucksEnv = new nunjucks.Environment(
	new nunjucks.FileSystemLoader(viewsPath, {
		noCache: true,
		watch: true,
	}),
);

export class KoaApp implements Application {
	readonly #koa: Koa;
	readonly #router: Router;

	constructor(koa: Koa, router: Router) {
		this.#koa = koa;
		this.#router = router;

		this.#koa.use(
			views(path.join(process.cwd(), "views"), {
				map: { njk: "nunjucks" },
				extension: "njk",
				options: {
					nunjucksEnv,
				},
			}),
		);
	}

	get(path: string, handler: Handler) {
		this.#router.get(path, async (ctx) => handler(this.createContext(ctx)));
		return this;
	}

	post(path: string, handler: Handler) {
		this.#router.post(path, async (ctx) => handler(this.createContext(ctx)));
		return this;
	}

	patch(path: string, handler: Handler) {
		this.#router.patch(path, async (ctx) => handler(this.createContext(ctx)));
		return this;
	}

	delete(path: string, handler: Handler) {
		this.#router.delete(path, async (ctx) => handler(this.createContext(ctx)));
		return this;
	}

	resource(path: string, resource: Resource) {
		const router = new Router({ prefix: path });

		router.get("/", async (ctx) => {
			const context = this.createContext(ctx);
			await resource.index(context);
		});

		router.get("/create", async (ctx) => {
			const context = this.createContext(ctx);
			await resource.create(context);
		});

		router.get("/:id/edit", async (ctx) => {
			const context = this.createContext(ctx);
			await resource.edit(context);
		});

		router.get("/:id", async (ctx) => {
			const context = this.createContext(ctx);
			await resource.show(context);
		});

		router.post("/", async (ctx) => {
			const context = this.createContext(ctx);
			await resource.store(context);
		});

		router.patch("/:id", async (ctx) => {
			const context = this.createContext(ctx);
			await resource.update(context);
		});

		router.delete("/:id", async (ctx) => {
			const context = this.createContext(ctx);
			await resource.delete(context);
		});

		this.#router.use(router.routes());
		this.#router.use(router.allowedMethods());

		return this;
	}

	private createContext(
		ctx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext>,
	) {
		return new KoaHttpContext(ctx);
	}

	listen(port: number, cb?: () => void) {
		this.#koa.use(this.#router.routes());
		this.#koa.use(this.#router.allowedMethods());

		return this.#koa.listen(port, cb);
	}

	use(middleware: Middleware) {
		this.#koa.use(async (ctx, next) => {
			const context = this.createContext(ctx);
			await middleware(context);
			await next();
		});

		return this;
	}
}
