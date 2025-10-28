import fs from "node:fs";
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

export const createExpressApp: () => Application = () => {
	const app = express();
	const templateEngine = new ScreamTemplateEngine(
		new Resolver(
			new SystemFileLoader(),
			new Tokenizer(),
			new Parser(),
			new Transformer(),
		),
		new Evaluator(),
		new Generator(),
	);

	const viewsPath = path.join(process.cwd(), "views");

	app.engine("njk", (filePath, options, callback) => {
		fs.readFile(filePath, { encoding: "utf-8" }, (err, content) => {
			if (err) {
				return callback(err);
			}

			const rendered = templateEngine.compile(content, { ...options });

			return callback(null, rendered);
		});
	});

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

	return new ExpressApp(app);
};
