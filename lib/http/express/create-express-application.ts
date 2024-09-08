import path from "node:path";

import express from "express";
import nunjucks from "nunjucks";

import type { Application } from "../application.interface.js";
import { ExpressApp } from "./express-application.js";

export const createExpressApp: () => Application = () => {
	const app = express();

	const viewsPath = path.join(process.cwd(), "views");

	app.set("views", viewsPath);
	app.set("view engine", "njk");

	nunjucks
		.configure(viewsPath, {
			autoescape: true,
			express: app,
			watch: true,
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
