import {
	type IncomingMessage,
	STATUS_CODES,
	type ServerResponse,
} from "node:http";
import { parse } from "node:url";

import type nunjucks from "nunjucks";

import type { Validator } from "@scream.js/validator/validator.js";
import type { HttpContext } from "../http-context.js";

export class ScreamHttpContext implements HttpContext {
	readonly #req: Readonly<IncomingMessage>;
	readonly #res: ServerResponse;
	readonly #parsedUrl: ReturnType<typeof parse>;
	readonly #body: Record<string, unknown>;
	readonly #nunjucks: nunjucks.Environment;

	constructor(
		req: Readonly<IncomingMessage>,
		res: ServerResponse,
		body: Record<string, unknown>,
		nunjucks: nunjucks.Environment,
	) {
		this.#req = req;
		this.#res = res;
		this.#body = body;
		this.#nunjucks = nunjucks;

		this.#parsedUrl = parse(req.url ?? "", true);
	}

	internalServerError(message: string): void {
		this.#res
			.writeHead(500, STATUS_CODES[500], { "Content-Type": "text/plain" })
			.end(message);
	}

	notFound() {
		this.#res
			.writeHead(404, STATUS_CODES[404], { "Content-Type": "text/plain" })
			.end(STATUS_CODES[404]);
	}

	params() {
		const path = this.#parsedUrl.pathname ?? "";
		const paramRegex = /\/(?<id>\d+)/;
		const match = paramRegex.exec(path);
		return match?.groups ?? {};
	}

	param(key: string): string {
		return this.params()[key] ?? "";
	}

	body() {
		return this.#body;
	}

	method() {
		return this.#req.method ?? "";
	}

	headers() {
		return this.#req.headers;
	}

	url() {
		return this.#req.url ?? "";
	}

	onClose(cb: () => void) {
		this.#res.on("close", cb);
	}

	hasHeader(header: string) {
		return !!this.#req.headers[header.toLowerCase()];
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

	json(data: object) {
		const body = JSON.stringify(data);

		return this.#res
			.writeHead(200, {
				"Content-Type": "application/json",
				"Content-Length": Buffer.byteLength(body),
			})
			.end(body);
	}

	text(message: string) {
		return this.#res
			.writeHead(200, STATUS_CODES[200], {
				"Content-Type": "text/plain",
				"Content-Length": Buffer.byteLength(STATUS_CODES[200] ?? ""),
			})
			.end(message);
	}

	redirect(url: string) {
		return this.#res.writeHead(302, { Location: url }).end();
	}

	status(code: number) {
		this.#res.statusCode = code;
		return this;
	}

	async render(template: string, locals?: Record<string, unknown>) {
		return new Promise<void>((resolve, reject) => {
			this.#nunjucks.render(`${template}.njk`, locals ?? {}, (err, result) => {
				if (err) {
					return reject(err);
				}

				this.#res.setHeader("Content-Type", "text/html").end(result);
				resolve();
			});
		});
	}

	location(url: string) {
		this.#res.setHeader("Location", url);
	}

	back() {
		const referrer = this.#req.headers.referer ?? "/";
		this.redirect(referrer);
	}

	handleError(error: unknown) {
		console.error("Error:", error);
		this.status(500).text("Internal Server Error");
	}

	end(chunk?: unknown) {
		this.#res.end(chunk);
	}

	validate<T>(validator: Validator<T>) {
		return validator.validate(this.body());
	}
}
