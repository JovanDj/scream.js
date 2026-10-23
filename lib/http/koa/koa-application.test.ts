import { once } from "node:events";
import { describe, it, type TestContext } from "node:test";
import { promisify } from "node:util";
import { KoaApp } from "./koa-application.js";

describe("Koa routing", () => {
	it("passes named route parameters to the handler", async (t: TestContext) => {
		const app = KoaApp.create();
		app.get("/hello/:name", async (ctx) =>
			ctx.redirect(`/welcome/${ctx.param("name")}`),
		);
		const server = app.listen(0);
		t.after(() => promisify(server.close.bind(server))());
		await once(server, "listening");
		const address = server.address();
		t.assert.ok(address && typeof address === "object");

		const response = await fetch(
			`http://localhost:${address.port}/hello/Alice`,
			{ redirect: "manual" },
		);

		t.assert.strictEqual(response.status, 302);
		t.assert.strictEqual(response.headers.get("location"), "/welcome/Alice");
	});

	it("routes prefixed resources and form method overrides", async (t: TestContext) => {
		const app = KoaApp.create();
		app.resource("/items", {
			create: async (ctx) => ctx.redirect("/created"),
			destroy: async (ctx) => ctx.redirect("/deleted"),
			edit: async (ctx) => ctx.redirect("/edited"),
			index: async (ctx) => ctx.redirect("/listed"),
			show: async (ctx) => ctx.redirect(`/shown/${ctx.param("id")}`),
			store: async (ctx) => ctx.redirect("/stored"),
			update: async (ctx) => ctx.redirect(`/updated/${ctx.param("id")}`),
		});
		const server = app.listen(0);
		t.after(() => promisify(server.close.bind(server))());
		await once(server, "listening");
		const address = server.address();
		t.assert.ok(address && typeof address === "object");

		const shown = await fetch(`http://localhost:${address.port}/items/42`, {
			redirect: "manual",
		});
		const updated = await fetch(`http://localhost:${address.port}/items/42`, {
			body: new URLSearchParams({ _method: "PATCH" }),
			method: "POST",
			redirect: "manual",
		});

		t.assert.strictEqual(shown.status, 302);
		t.assert.strictEqual(shown.headers.get("location"), "/shown/42");
		t.assert.strictEqual(updated.status, 302);
		t.assert.strictEqual(updated.headers.get("location"), "/updated/42");
	});
});
