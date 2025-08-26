import path from "node:path";
import { bodyParser } from "@koa/bodyparser";
import Router from "@koa/router";
import Koa from "koa";
import nunjucks from "nunjucks";
import type { Application } from "../application.js";
import { KoaApp } from "./koa-application.js";

declare module "koa" {
	interface DefaultContext {
		render: (view: string, locals?: Record<string, unknown>) => void;
	}
}

export const createKoaApp: () => Application = () => {
	const koa = new Koa();

	const viewsPath = path.join(process.cwd(), "views");

	const nunjucksEnv = new nunjucks.Environment(
		new nunjucks.FileSystemLoader(viewsPath, {
			noCache: true,
			watch: true,
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
};
