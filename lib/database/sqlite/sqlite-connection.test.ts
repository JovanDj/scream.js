import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { type Database, open } from "sqlite";
import sqlite3 from "sqlite3";
import type { Connection } from "../connection.js";
import { SqliteConnection } from "./sqlite-connection.js";

describe("SqliteDatabase", () => {
	let db: Database;
	let connection: Connection;

	beforeEach(async () => {
		db = await open({ driver: sqlite3.Database, filename: ":memory:" });
		connection = new SqliteConnection(db);
	});

	afterEach(async () => {
		await connection.close();
	});

	it("finds all rows", async () => {
		await connection.run({ sql: "CREATE TABLE users (id INTEGER);" });
		await connection.run({
			sql: "INSERT INTO users VALUES (?);",
			params: ["1"],
		});

		const users = await connection.all({
			sql: "SELECT * FROM users;",
			params: [],
		});

		assert.deepStrictEqual(users, [{ id: 1 }]);
	});

	it("finds single row", async () => {
		await connection.run({ sql: "CREATE TABLE users (id INTEGER);" });
		await connection.run({
			sql: "INSERT INTO users VALUES (?);",
			params: ["1"],
		});

		const user = await connection.get({
			sql: "SELECT * FROM users;",
			params: [],
		});

		assert.deepStrictEqual(user, { id: 1 });
	});

	it("creates a new row", async () => {
		await connection.run({ sql: "CREATE TABLE users (id INTEGER);" });
		await connection.run({
			sql: "INSERT INTO users (id) VALUES (?);",
			params: ["1"],
		});

		const user = await connection.get({
			sql: "SELECT * FROM users WHERE id = ?;",
			params: ["1"],
		});

		assert.deepStrictEqual(user, { id: 1 });
	});

	it("updates a row", async () => {
		await connection.run({
			sql: "CREATE TABLE users (id INTEGER, name TEXT);",
		});
		await connection.run({
			sql: "INSERT INTO users (id, name) VALUES (?, ?);",
			params: ["1", "Alice"],
		});

		await connection.run({
			sql: "UPDATE users SET name = ? WHERE id = ?;",
			params: ["Bob", "1"],
		});

		const user = await connection.get({
			sql: "SELECT * FROM users WHERE id = ?;",
			params: ["1"],
		});

		assert.deepStrictEqual(user, { id: 1, name: "Bob" });
	});

	it("deletes a row", async () => {
		await connection.run({
			sql: "CREATE TABLE users (id INTEGER, name TEXT);",
		});

		await connection.run({
			sql: "INSERT INTO users (id, name) VALUES (?, ?);",
			params: ["1", "Alice"],
		});

		await connection.run({
			sql: "DELETE FROM users WHERE id = ?;",
			params: ["1"],
		});

		const user = await connection.get({
			sql: "SELECT * FROM users WHERE id = ?;",
			params: ["1"],
		});

		assert.strictEqual(user, undefined);
	});
});
