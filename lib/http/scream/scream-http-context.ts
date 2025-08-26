import {
	type IncomingMessage,
	type ServerResponse,
	STATUS_CODES,
} from "node:http";
import path from "node:path";
import { StringDecoder } from "node:string_decoder";
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

	// Parse URL parameters
	params() {
		const path = this.#parsedUrl.pathname || "";
		const paramRegex = /\/(?<id>\d+)/;
		const match = paramRegex.exec(path);
		return match?.groups || {};
	}

	param(key: string): string {
		return this.params()[key] ?? "";
	}

	// Get parsed request body (this could be parsed JSON, form data, etc.)
	body() {
		return this.#bodyData;
	}

	// Get HTTP method
	method() {
		return this.#req.method || "";
	}

	// Get request headers
	headers() {
		return this.#req.headers;
	}

	// Get the request URL
	url() {
		return this.#req.url || "";
	}

	// Handle the "close" event on the response
	onClose(cb: () => void) {
		this.#res.on("close", cb);
	}

	// Check if a specific header exists
	hasHeader(header: string) {
		return !!this.#req.headers[header.toLowerCase()];
	}

	// Handle language preferences (simplified for this example)
	acceptsLanguages(languages: readonly string[]) {
		const acceptLang = this.#req.headers["accept-language"];

		// Default to "en" or another fallback language
		if (!acceptLang) {
			return "en";
		}

		for (const lang of languages) {
			if (acceptLang.includes(lang)) return lang;
		}

		return "en"; // Return a default language if no match is found
	}

	// Send JSON response
	json(data: object) {
		const body = JSON.stringify(data);

		this.#res
			.writeHead(200, {
				"Content-Length": Buffer.byteLength(body),
				"Content-Type": "application/json",
			})
			.end(body);
	}

	// Send plain text response
	text(message: string) {
		this.#res
			.writeHead(200, STATUS_CODES[200], {
				"Content-Length": Buffer.byteLength(message),
				"Content-Type": "text/plain",
			})
			.end(message);
	}

	// Handle redirects
	redirect(url: string): void {
		this.#res.writeHead(302, { Location: url });
		this.#res.end();
	}

	// Set HTTP status code
	status(code: number): this {
		this.#res.statusCode = code;
		return this;
	}

	// Render a template using Nunjucks
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

	// Set the "Location" header for redirect or resource location
	location(url: string): void {
		this.#res.setHeader("Location", url);
	}

	// Redirect back to the referrer or default to "/"
	back(): void {
		const referrer = this.#req.headers.referer || "/";
		this.redirect(referrer);
	}

	// Error handling
	handleError(error: unknown): void {
		console.error("Error:", error);
		this.status(500).text("Internal Server Error");
	}

	// End the response manually (optional chunk data)
	end(chunk?: unknown): void {
		this.#res.end(chunk);
	}

	// Utility method to read request body (for POST/PUT requests)
	async readBody() {
		if (
			this.method() !== "POST" &&
			this.method() !== "PUT" &&
			this.method() !== "PATCH"
		) {
			return "";
		}

		const decoder = new StringDecoder("utf-8");
		let body = "";

		for await (const chunk of this.#req) {
			body += decoder.write(chunk);
		}

		body += decoder.end();

		try {
			this.#bodyData = JSON.parse(body);
		} catch (_e) {
			this.#bodyData = body;
		}

		return;
	}

	validate<T>(validator: Validator<T>) {
		return validator.validate(this.body());
	}
}
