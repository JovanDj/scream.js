import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
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
		const address = this.#server.address();
		if (!this.#isAddressInfo(address)) {
			throw new Error("Failed to resolve server port");
		}

		return address.port;
	}

	get server() {
		return this.#server;
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

	#isAddressInfo(address: unknown): address is AddressInfo {
		return !!address && typeof address === "object" && "port" in address;
	}
}
