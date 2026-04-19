import path from "node:path";
import { bodyParser } from "@koa/bodyparser";
import Router from "@koa/router";
import type Koa from "koa";
import KoaClass from "koa";
import nunjucks from "nunjucks";

import type { Application } from "../application.js";
import type { Handler } from "../handler.js";
import { NotFoundError } from "../not-found-error.js";
import type { Resource } from "../resource.js";
import { KoaHttpContext } from "./koa-http-context.js";

declare module "koa" {
	interface DefaultContext {
		render: (view: string, locals?: Record<string, unknown>) => void;
	}
}

export class KoaApp implements Application {
	readonly #koa: Koa;
	readonly #router: Router;

	static create(): Application {
		const koa = new KoaClass();
		const viewsPath = path.join(process.cwd(), "views");
		const nunjucksEnv = new nunjucks.Environment(
			new nunjucks.FileSystemLoader(viewsPath, {
				noCache: true,
				watch: process.env["NODE_ENV"] === "development",
			}),
		).addGlobal("viteScripts", () => {
			return `
			<link rel="stylesheet" href="http://localhost:5173/styles.scss">
			<script type="module" src="http://localhost:5173/main.ts"></script>
			<script type="module" src="http://localhost:5173/@vite/client"></script>`;
		});

		koa.use(bodyParser());

		koa.use(async (ctx, next) => {
			ctx.render = async (view, locals = {}) => {
				const filename = path.extname(view) ? view : `${view}.njk`;
				const data = { ...ctx.state, ...locals };

				const html = await new Promise((resolve, reject) => {
					nunjucksEnv.render(filename, data, (err, res) =>
						err ? reject(err) : resolve(res),
					);
				});

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
			try {
				await handler(context);
			} catch (error) {
				if (!(error instanceof NotFoundError)) {
					throw error;
				}
			}
		});
		return this;
	}

	post(path: string, handler: Handler) {
		this.#router.post(path, async (ctx) => {
			const context = this.#createContext(ctx);
			try {
				await handler(context);
			} catch (error) {
				if (!(error instanceof NotFoundError)) {
					throw error;
				}
			}
		});
		return this;
	}

	resource(path: string, resource: Resource) {
		const router = new Router({ prefix: path });

		router.get("/", (ctx) => resource.index(this.#createContext(ctx)));

		router.get("/create", (ctx) => resource.create(this.#createContext(ctx)));

		router.post("/create", (ctx) => resource.store(this.#createContext(ctx)));

		router.get("/:id/edit", (ctx) => resource.edit(this.#createContext(ctx)));

		router.get("/:id", (ctx) => resource.show(this.#createContext(ctx)));

		router.post("/:id/edit", (ctx) =>
			resource.update(this.#createContext(ctx)),
		);

		router.post("/:id/delete", (ctx) =>
			resource.delete(this.#createContext(ctx)),
		);

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
