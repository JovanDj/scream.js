import path from "node:path";
import { Evaluator } from "@scream.js/template-engine/evaluator.js";
import { Generator } from "@scream.js/template-engine/generator.js";
import { Parser } from "@scream.js/template-engine/parser.js";
import { Resolver } from "@scream.js/template-engine/resolver.js";
import { SystemFileLoader } from "@scream.js/template-engine/system-file-loader.js";
import { ScreamTemplateEngine } from "@scream.js/template-engine/template-engine.js";
import { Tokenizer } from "@scream.js/template-engine/tokenizer.js";
import { Transformer } from "@scream.js/template-engine/transformer.js";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

import type { Application } from "../application.js";
import { ExpressApp } from "./express-application.js";

type ExpressAppOptions = {
	appRoot?: string;
	assetsProxyTarget?: string;
	staticDir?: string;
	viewsDir?: string;
};

export const createExpressApp = ({
	appRoot = process.cwd(),
	assetsProxyTarget = "http://localhost:5173",
	staticDir,
	viewsDir,
}: ExpressAppOptions = {}): Application => {
	const app = express();
	const templateEngine = new ScreamTemplateEngine(
		new Resolver(
			new SystemFileLoader(viewsDir ?? path.join(appRoot, "views")),
			new Tokenizer(),
			new Parser(),
			new Transformer(),
		),
		new Evaluator(),
		new Generator(),
	);

	const resolvedViewsDir = viewsDir ?? path.join(appRoot, "views");
	const resolvedStaticDir = staticDir ?? path.join(appRoot, "resources");

	app.engine("njk", async (filePath, options, callback) => {
		try {
			const rendered = await templateEngine.compileFile(filePath, {
				...options,
			});
			callback(null, rendered);
		} catch (err) {
			callback(err);
		}
	});

	app.set("views", resolvedViewsDir);
	app.set("view engine", "njk");

	app.use(express.urlencoded({ extended: true }));
	app.use(express.static(resolvedStaticDir));

	app.use(
		"/assets",
		createProxyMiddleware({
			changeOrigin: true,
			target: assetsProxyTarget,
		}),
	);

	return new ExpressApp(app);
};
