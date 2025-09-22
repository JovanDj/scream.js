import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it, type TestContext } from "node:test";
import { setupDb, teardownDb } from "@scream.js/database/db.js";
import { app } from "main.js";

function isAddressInfo(address: unknown): address is AddressInfo {
	return !!address && typeof address === "object" && "port" in address;
}

describe("server", { concurrency: true }, () => {
	let server: Server;
	let port: number;

	before(async () => {
		server = app.listen(0);

		const address = server.address();

		if (isAddressInfo(address)) {
			port = address.port;
		}

		await setupDb();
	});

	after(async () => {
		server.close();
		await teardownDb();
	});

	it("should respond with 200", async (t: TestContext) => {
		t.plan(1);
		const res = await fetch(`http://localhost:${port}/`, { signal: t.signal });
		t.assert.deepStrictEqual<number>(res.status, 200);
	});

	it("should respond with 200", async (t: TestContext) => {
		t.plan(1);
		const res = await fetch(`http://localhost:${port}/about`, {
			signal: t.signal,
		});
		t.assert.deepStrictEqual<number>(res.status, 200);
	});

	it("should respond with 404", async (t: TestContext) => {
		t.plan(1);
		const res = await fetch(`http://localhost:${port}/adfasdf`, {
			signal: t.signal,
		});
		t.assert.deepStrictEqual<number>(res.status, 404);
	});

	it("GET /todos should list todos", async (t: TestContext) => {
		t.plan(2);
		const res = await fetch(`http://localhost:${port}/todos`, {
			signal: t.signal,
		});

		t.assert.ok(res.ok);
		t.assert.deepStrictEqual<number>(res.status, 200);
	});

	it("POST /todos/create with missing title should show errors", async (t: TestContext) => {
		t.plan(1);
		const res = await fetch(`http://localhost:${port}/todos/create`, {
			body: "title=&userId=1",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			method: "POST",
			signal: t.signal,
		});

		const html = await res.text();
		t.assert.match(
			html,
			/Too small: expected string to have &gt;=1 characters\r\n/i,
		);
	});

	it("PUT /todos/:id with missing or invalid id returns 500", async (t: TestContext) => {
		t.plan(2);
		const res = await fetch(`http://localhost:${port}/todos/99999`, {
			body: "title=SomeTitle",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			method: "PUT",
			signal: t.signal,
		});
		t.assert.deepStrictEqual<number>(res.status, 404);

		const body = await res.text();
		t.assert.match(body, /not found|error|unknown/i);
	});

	it("renders todo details with actual data", async (t: TestContext) => {
		t.plan(4);
		const createRes = await fetch(`http://localhost:${port}/todos/create`, {
			body: "title=SomeTitle&userId=1",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			method: "POST",
			redirect: "manual",
			signal: t.signal,
		});

		const location = createRes.headers.get("Location");
		t.assert.ok(location, "Location header should be present");
		const todoId = location.split("/").pop();

		const res = await fetch(`http://localhost:${port}/todos/${todoId}`);
		const html = await res.text();

		t.assert.match(html, /SomeTitle/);
		t.assert.match(html, new RegExp(`Todo \\| ${todoId}`));
		t.assert.match(html, /en-US/);
	});
});
