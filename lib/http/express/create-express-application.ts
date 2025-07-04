import path from "node:path";

import express from "express";
import nunjucks from "nunjucks";

import { createProxyMiddleware } from "http-proxy-middleware";
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
			target: "http://localhost:5173",
			changeOrigin: true,
		}),
	);

	nunjucks
		.configure(viewsPath, {
			autoescape: true,
			express: app,
			watch: process.env["NODE_ENV"] === "development",
			noCache: true,
		})
		.addGlobal("viteScripts", () => {
			return `
			<script defer async type="module" src="http://localhost:5173/@vite/client"></script>
			<script defer async type="module" src="http://localhost:5173/resources/main.js"></script>
		`;
		});

	return new ExpressApp(app);
};
