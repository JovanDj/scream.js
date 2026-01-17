import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Knex } from "knex";
import type { Logger } from "../logger/logger.interface.js";
import type { Application } from "./application.js";

type StartHttpServerOptions = {
	app: Application;
	db: Knex;
	logger: Logger;
	port?: number;
};

const closeServer = (server: Server) => {
	return new Promise<void>((resolve, reject) => {
		server.close((err) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
};

const startHttpServer = ({
	app,
	db,
	logger,
	port = 3000,
}: StartHttpServerOptions) => {
	const server = app.listen(port, () => {
		logger.log(`Listening on port ${port}`);
	});

	const shutdown = async () => {
		await closeServer(server);
		await db.destroy();
	};

	const handleSignal = () => {
		shutdown().catch((error) => {
			logger.error(error);
			process.exitCode = 1;
		});
	};

	process.on("SIGINT", handleSignal);
	process.on("SIGTERM", handleSignal);

	return { server, shutdown };
};

const isAddressInfo = (address: unknown): address is AddressInfo => {
	return !!address && typeof address === "object" && "port" in address;
};

const startTestServer = async (app: Application) => {
	const server = app.listen(0);
	const address = server.address();

	if (!isAddressInfo(address)) {
		await closeServer(server);
		throw new Error("Failed to start server");
	}

	const { port } = address;

	const shutdown = async () => {
		return closeServer(server);
	};

	return { port, server, shutdown };
};

export { closeServer, startHttpServer, startTestServer };
