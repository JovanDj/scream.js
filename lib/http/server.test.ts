import { describe, it, type TestContext } from "node:test";
import { ExpressApp } from "./express/express-application.js";
import { HttpServer } from "./server.js";

describe("HttpServer", { concurrency: true }, () => {
	it("runs listening and shutdown callbacks", async (t: TestContext) => {
		t.plan(3);
		let listenedPort = 0;
		let shutdownCalled = false;
		const app = ExpressApp.create();

		const httpServer = HttpServer.start({
			app,
			onListening: (port) => {
				listenedPort = port;
			},
			onShutdown: async () => {
				shutdownCalled = true;
			},
			port: 0,
		});

		try {
			t.assert.deepStrictEqual(listenedPort, 0);
			t.assert.ok(httpServer.port > 0);
		} finally {
			await httpServer.shutdown();
		}

		t.assert.deepStrictEqual(shutdownCalled, true);
	});

	it("rejects when shutting down an already closed server", async (t: TestContext) => {
		t.plan(1);
		const app = ExpressApp.create();
		const httpServer = HttpServer.start({ app, port: 0 });

		await httpServer.shutdown();

		await t.assert.rejects(() => httpServer.shutdown());
	});
});
