import { describe, it, type TestContext } from "node:test";
import { ExpressApp } from "./express/express-application.js";
import { HttpServer } from "./server.js";

describe("HttpServer", { concurrency: true }, () => {
	it(
		"runs listening and shutdown callbacks",
		{ timeout: 2000 },
		async (t: TestContext) => {
			t.plan(3);
			const listening = Promise.withResolvers<number>();
			let shutdownCalled = false;
			const app = ExpressApp.create();

			const httpServer = HttpServer.start({
				app,
				onListening: (port) => {
					listening.resolve(port);
				},
				onShutdown: async () => {
					shutdownCalled = true;
				},
				port: 0,
			});

			t.after(async () => {
				if (!shutdownCalled) {
					await httpServer.shutdown();
				}
			});
			try {
				const listenedPort = await listening.promise;

				t.assert.deepStrictEqual<number>(listenedPort, 0);
				t.assert.ok(httpServer.port > 0);
			} finally {
				await httpServer.shutdown();
			}

			t.assert.deepStrictEqual(shutdownCalled, true);
		},
	);

	it("rejects when shutting down an already closed server", async (t: TestContext) => {
		t.plan(1);
		const app = ExpressApp.create();
		const httpServer = HttpServer.start({ app, port: 0 });

		await httpServer.shutdown();

		await t.assert.rejects(() => httpServer.shutdown());
	});
});
