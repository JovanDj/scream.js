import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { describe, expect, it, vi } from "vitest";
import { SqliteConnection } from "./sqlite-connection.js";

describe("SqliteDatabase", () => {
	it("finds all rows", async () => {
		const db = await open({ driver: sqlite3.Database, filename: ":memory:" });
		const connection = new SqliteConnection(db);

		await db.exec("CREATE TABLE users (id INTEGER);");
		await db.exec("INSERT INTO users VALUES (1)");

		const users = await connection.all("SELECT * FROM users;", []);
		await connection.close();

		expect(users).toStrictEqual([{ id: 1 }]);
	});

	it("finds single row", async () => {
		const db = await open({ driver: sqlite3.Database, filename: ":memory:" });
		const connection = new SqliteConnection(db);

		await db.exec("CREATE TABLE users (id INTEGER);");
		await db.exec("INSERT INTO users VALUES (1)");

		const users = await connection.get("SELECT * FROM users;");
		await connection.close();

		expect(users).toStrictEqual({ id: 1 });
	});

	it("closes database", async () => {
		const db = await open({ driver: sqlite3.Database, filename: ":memory:" });
		const connection = new SqliteConnection(db);

		db.close = vi.fn();

		await connection.close();
		expect(db.close).toBeCalled();
	});
});
