import {
	type IncomingMessage,
	type ServerResponse,
	STATUS_CODES,
} from "node:http";
import path from "node:path";
import { parse } from "node:url";
import type { Database, DatabaseTransaction } from "@scream.js/database/db.js";
import type { Validator } from "@scream.js/validator/validator.js";
import nunjucks from "nunjucks";
import type { HttpContext } from "../http-context.js";

export class ScreamHttpContext implements HttpContext {
	readonly #db: Database;
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

	constructor(
		req: Readonly<IncomingMessage>,
		res: ServerResponse,
		db: Database,
	) {
		this.#res = res;
		this.#parsedUrl = parse(req.url || "", true);
		this.#db = db;
	}

	db(table: string) {
		return this.#db(table);
	}

	transaction<T>(callback: (tx: DatabaseTransaction) => Promise<T>) {
		return this.#db.transaction(callback);
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

	#query() {
		return this.#parsedUrl.query;
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

	param<T>(key: string, validator: Validator<T>) {
		const result = validator.validate(this.#paramValue(key));
		return result.success ? result.data : undefined;
	}

	body<T>(validator: Validator<T>) {
		return validator.validate(this.#body());
	}

	query<T>(validator: Validator<T>) {
		return validator.validate(this.#query());
	}
}
