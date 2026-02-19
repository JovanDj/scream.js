import {
	type IncomingMessage,
	type ServerResponse,
	STATUS_CODES,
} from "node:http";
import path from "node:path";
import { parse } from "node:url";
import nunjucks from "nunjucks";
import { z } from "zod/v4";
import type { HttpContext } from "../http-context.js";

export class ScreamHttpContext implements HttpContext {
	readonly #res: ServerResponse;
	readonly #parsedUrl: ReturnType<typeof parse>;
	#bodyData: unknown | undefined = undefined;
	#statusCode = 200;

	readonly #nunjucks = new nunjucks.Environment(
		new nunjucks.FileSystemLoader(path.join(process.cwd(), "views"), {
			noCache: true,
			watch: true,
		}),
	);

	constructor(req: Readonly<IncomingMessage>, res: ServerResponse) {
		this.#res = res;
		this.#parsedUrl = parse(req.url || "", true);
	}

	notFound() {
		this.#res
			.writeHead(404, STATUS_CODES[404], { "Content-Type": "text/plain" })
			.end(STATUS_CODES[404]);
	}

	unprocessableEntity(body?: string) {
		this.#statusCode = 422;
		if (body) {
			this.#res
				.writeHead(422, STATUS_CODES[422], { "Content-Type": "text/plain" })
				.end(body);
		}
	}

	params() {
		const path = this.#parsedUrl.pathname || "";
		const paramRegex = /\/(?<id>\d+)/;
		const match = paramRegex.exec(path);
		return match?.groups || {};
	}

	#paramValue(key: string): string {
		return this.params()[key] ?? "";
	}

	#body() {
		return this.#bodyData;
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
				this.#res
					.writeHead(this.#statusCode, {
						"Content-Type": "text/html",
					})
					.end(result);
				resolve();
			});
		});
	}

	param<S extends z.ZodType>(key: string, schema: (zod: typeof z) => S) {
		return schema(z).safeParse(this.#paramValue(key));
	}

	body<S extends z.ZodType>(schema: (zod: typeof z) => S) {
		return schema(z).safeParse(this.#body());
	}
}
