import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import type { Connection } from "../connection.js";
import { SqliteConnection } from "./sqlite-connection.js";

describe("SqliteDatabase", () => {
	it("finds all rows", async () => {
		const db = await open({ driver: sqlite3.Database, filename: ":memory:" });
		const connection: Connection = new SqliteConnection(db);

		await db.run("CREATE TABLE users (id INTEGER);");
		await db.run("INSERT INTO users VALUES (1)");

		const users = await connection.all("SELECT * FROM users;", []);
		await connection.close();

		assert.deepStrictEqual(users, [{ id: 1 }]);
	});

	it("finds single row", async () => {
		const db = await open({ driver: sqlite3.Database, filename: ":memory:" });
		const connection: Connection = new SqliteConnection(db);

		await db.run("CREATE TABLE users (id INTEGER);");
		await db.run("INSERT INTO users VALUES (1)");

		const user = await connection.get("SELECT * FROM users;");
		await connection.close();

		assert.deepStrictEqual(user, { id: 1 });
	});

	it("creates a new row", async () => {
		const db = await open({ driver: sqlite3.Database, filename: ":memory:" });
		const connection: Connection = new SqliteConnection(db);

		await connection.run("CREATE TABLE users (id INTEGER);");
		await connection.run("INSERT INTO users (id) VALUES (?);", ["1"]);

		const user = await connection.get("SELECT * FROM users WHERE id = ?;", [
			"1",
		]);
		await connection.close();

		assert.deepStrictEqual(user, { id: 1 });
	});

	it("updates a row", async () => {
		const db = await open({ driver: sqlite3.Database, filename: ":memory:" });
		const connection: Connection = new SqliteConnection(db);

		await db.run("CREATE TABLE users (id INTEGER, name TEXT);");
		await connection.run("INSERT INTO users (id, name) VALUES (?, ?);", [
			"1",
			"Alice",
		]);

		await connection.run("UPDATE users SET name = ? WHERE id = ?;", [
			"Bob",
			"1",
		]);

		const user = await connection.get("SELECT * FROM users WHERE id = ?;", [
			"1",
		]);
		await connection.close();

		assert.deepStrictEqual(user, { id: 1, name: "Bob" });
	});

	it("deletes a row", async () => {
		const db = await open({ driver: sqlite3.Database, filename: ":memory:" });
		const connection: Connection = new SqliteConnection(db);

		await connection.run("CREATE TABLE users (id INTEGER, name TEXT);");
		await connection.run("INSERT INTO users (id, name) VALUES (?, ?);", [
			"1",
			"Alice",
		]);

		await connection.run("DELETE FROM users WHERE id = ?;", ["1"]);

		const user = await connection.get("SELECT * FROM users WHERE id = ?;", [
			"1",
		]);
		await connection.close();

		assert.strictEqual(user, undefined);
	});
});
