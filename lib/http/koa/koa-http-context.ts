import type { Database, DatabaseTransaction } from "@scream.js/database/db.js";
import type { Validator } from "@scream.js/validator/validator.js";
import type Koa from "koa";
import type { HttpContext } from "../http-context.js";

export class KoaHttpContext implements HttpContext {
	readonly #db: Database;
	readonly #ctx: Koa.Context;

	constructor(ctx: Koa.Context, db: Database) {
		this.#ctx = ctx;
		this.#db = db;
	}

	db(table: string) {
		return this.#db(table);
	}

	ref(column: string) {
		return this.#db.ref(column);
	}

	transaction<T>(callback: (tx: DatabaseTransaction) => Promise<T>) {
		return this.#db.transaction(callback);
	}

	params() {
		return this.#ctx["params"];
	}

	#paramValue(key: string) {
		return this.params()[key] ?? "";
	}

	#body() {
		return this.#ctx.request.body;
	}

	#query() {
		return this.#ctx.query;
	}

	#end(chunk?: unknown) {
		this.#ctx.res.end(chunk);
	}

	#status(code: number) {
		this.#ctx.status = code;
		return this;
	}

	async render(template: string, locals?: Record<string, unknown>) {
		return this.#ctx.render(template, locals);
	}

	redirect(url: string) {
		this.#ctx.redirect(url);
	}

	unprocessableEntity(body?: string) {
		this.#status(422);
		if (body) {
			this.#end(body);
		}
	}

	notFound() {
		this.#status(404).#end("Not Found");
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
