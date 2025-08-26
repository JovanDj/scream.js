import assert from "node:assert/strict";
import type { Server } from "node:http";
import { afterEach, beforeEach, describe, it } from "node:test";

import { app } from "main.js";

describe("server", () => {
	let server: Server;
	beforeEach(() => {
		server = app.listen(3000);
	});

	afterEach(() => {
		server.close(() => process.exit());
	});

	it("should respond with 200", async () => {
		const res = await fetch("http://localhost:3000/");
		assert.equal(res.status, 200);
	});

	it("should respond with 200", async () => {
		const res = await fetch("http://localhost:3000/about");
		assert.equal(res.status, 200);
	});

	it("should respond with 404", async () => {
		const res = await fetch("http://localhost:3000/adfasdf");
		assert.equal(res.status, 404);
	});

	it("GET /todos should list todos", { timeout: 2000 }, async () => {
		const res = await fetch("http://localhost:3000/todos");

		assert.ok(res.ok);
		assert.equal(res.status, 200);
	});

	it("POST /todos with missing title should show errors", async () => {
		const res = await fetch("http://localhost:3000/todos", {
			body: "title=&userId=1",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			method: "POST",
		});
		const html = await res.text();
		assert.match(
			html,
			/Too small: expected string to have &gt;=1 characters\r\n/i,
		);
	});

	it("PUT /todos/:id with missing or invalid id returns 500", async () => {
		const res = await fetch("http://localhost:3000/todos/99999", {
			body: "title=SomeTitle",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			method: "PUT",
		});
		assert.equal(res.status, 404);

		const body = await res.text();
		assert.match(body, /not found|error|unknown/i);
	});

	it("renders todo details with actual data", async () => {
		const createRes = await fetch("http://localhost:3000/todos", {
			body: "title=ScreamJS+Test+Todo&userId=123",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			method: "POST",
		});
		const location = createRes.headers.get("location");
		assert.ok(location, "Location header should be present");
		const todoId = location.split("/").pop();

		const res = await fetch(`http://localhost:3000/todos/${todoId}`);
		const html = await res.text();

		assert.match(html, /ScreamJS Test Todo/);
		assert.match(html, new RegExp(`Todo \\| ${todoId}`));
		assert.match(html, /sr-Latn-RS/);
	});
});
