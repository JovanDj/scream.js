import type { Server } from "node:http";
import type { Application } from "./application.js";

export type HttpServerOptions = {
	app: Application;
	onListening?: (port: number) => void;
	onShutdown?: () => Promise<void>;
	port?: number;
};

export class HttpServer {
	readonly #onShutdown: (() => Promise<void>) | undefined;
	readonly #server: Server;

	static start(options: HttpServerOptions) {
		const { app, port = 3000 } = options;
		const server = app.listen(port, () => {
			options.onListening?.(port);
		});

		return new HttpServer(server, options);
	}

	private constructor(server: Server, options: HttpServerOptions) {
		this.#onShutdown = options.onShutdown;
		this.#server = server;
	}

	get port() {
		return (this.#server.address() as { port: number }).port;
	}

	async shutdown() {
		await this.#close();
		await this.#onShutdown?.();
	}

	#close() {
		return new Promise<void>((resolve, reject) => {
			this.#server.close((err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}
}
