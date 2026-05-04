import {
	type IncomingMessage,
	type ServerResponse,
	STATUS_CODES,
} from "node:http";
import path from "node:path";
import { parse } from "node:url";
import { ScreamTemplateEngine } from "@scream.js/template-engine/template-engine.js";
import type { HttpContext } from "../http-context.js";

export class ScreamHttpContext implements HttpContext {
	readonly #res: ServerResponse;
	readonly #parsedUrl: ReturnType<typeof parse>;
	#bodyData: unknown | undefined = undefined;
	readonly #templateEngine = ScreamTemplateEngine.create();

	constructor(req: Readonly<IncomingMessage>, res: ServerResponse) {
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

	#paramValue(key: string): string {
		return this.params()[key] ?? "";
	}

	#body() {
		return this.#bodyData;
	}

	#query() {
		return this.#parsedUrl.query;
	}

	redirect(url: string): void {
		this.#res.writeHead(302, { Location: url });
		this.#res.end();
	}

	async render(template: string, locals?: Record<string, unknown>) {
		const filename = path.extname(template) ? template : `${template}.scream`;
		const html = await this.#templateEngine.compileFile(
			path.join(process.cwd(), "views", filename),
			locals || {},
		);

		this.#res
			.writeHead(200, {
				"Content-Type": "text/html; charset=utf-8",
			})
			.end(html);
	}

	param(key: string) {
		return this.#paramValue(key);
	}

	body() {
		return this.#body();
	}

	query() {
		return this.#query();
	}
}
