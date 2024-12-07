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
		server.close();
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
});
