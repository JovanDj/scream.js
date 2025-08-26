import path from "node:path";

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import nunjucks from "nunjucks";

import type { Application } from "../application.js";
import { ExpressApp } from "./express-application.js";

export const createExpressApp: () => Application = () => {
	const app = express();

	const viewsPath = path.join(process.cwd(), "views");

	app.set("views", viewsPath);
	app.set("view engine", "njk");

	app.use(express.urlencoded({ extended: true }));
	app.use(express.static(path.join(process.cwd(), "resources")));

	app.use(
		"/assets",
		createProxyMiddleware({
			changeOrigin: true,
			target: "http://localhost:5173",
		}),
	);

	nunjucks
		.configure(viewsPath, {
			autoescape: true,
			express: app,
			noCache: process.env["NODE_ENV"] === "development",
			watch: process.env["NODE_ENV"] === "development",
		})
		.addGlobal("viteScripts", () => {
			return `
				<link rel="stylesheet" href="http://localhost:5173/styles.scss">
				<script type="module" src="http://localhost:5173/main.ts"></script>
				<script type="module" src="http://localhost:5173/@vite/client"></script>

			`;
		});

	return new ExpressApp(app);
};
