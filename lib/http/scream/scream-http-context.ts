import {
	type IncomingMessage,
	type ServerResponse,
	STATUS_CODES,
} from "node:http";
import path from "node:path";
import { parse } from "node:url";
import type { Validator } from "@scream.js/validator/validator.js";
import nunjucks from "nunjucks";
import type { HttpContext } from "../http-context.js";

export class ScreamHttpContext implements HttpContext {
	readonly #req: Readonly<IncomingMessage>;
	readonly #res: ServerResponse;
	readonly #parsedUrl: ReturnType<typeof parse>;
	#bodyData: unknown | undefined = undefined;

	readonly #nunjucks = new nunjucks.Environment(
		new nunjucks.FileSystemLoader(path.join(process.cwd(), "views"), {
			noCache: true,
			watch: true,
		}),
	);

	constructor(req: Readonly<IncomingMessage>, res: ServerResponse) {
		this.#req = req;
		this.#res = res;
		this.#parsedUrl = parse(req.url || "", true);
	}

	notFound() {
		this.#res
			.writeHead(404, STATUS_CODES[404], { "Content-Type": "text/plain" })
			.end(STATUS_CODES[404]);
	}

	params() {
		const path = this.#parsedUrl.pathname || "";
		const paramRegex = /\/(?<id>\d+)/;
		const match = paramRegex.exec(path);
		return match?.groups || {};
	}

	param(key: string): string {
		return this.params()[key] ?? "";
	}

	#body() {
		return this.#bodyData;
	}

	acceptsLanguages(languages: readonly string[]) {
		const acceptLang = this.#req.headers["accept-language"];

		if (!acceptLang) {
			return "en";
		}

		for (const lang of languages) {
			if (acceptLang.includes(lang)) {
				return lang;
			}
		}

		return "en";
	}

	redirect(url: string): void {
		this.#res.writeHead(302, { Location: url });
		this.#res.end();
	}

	async render(template: string, locals?: Record<string, unknown>) {
		return new Promise<void>((resolve, reject) => {
			this.#nunjucks.render(`${template}.njk`, locals || {}, (err, result) => {
				if (err) {
					return reject(err);
				}

				// Set HTML content type and send the rendered HTML
				this.#res.setHeader("Content-Type", "text/html").end(result);
				resolve();
			});
		});
	}

	validate<T>(validator: Validator<T>) {
		return validator.validate(this.#body());
	}
}
