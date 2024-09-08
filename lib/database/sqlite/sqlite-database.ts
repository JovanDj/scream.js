import { open } from "sqlite";
import sqlite3 from "sqlite3";
import type { ConnectionOptions } from "../connection-options.js";
import type { Database } from "../database.js";
import { SqliteConnection } from "./sqlite-connection.js";

export class SqliteDatabase implements Database {
	async connect(database: ConnectionOptions = { database: ":memory:" }) {
		const db = await open({
			driver: sqlite3.Database,
			filename: database.database,
		});

		await db.exec("PRAGMA foreign_keys = ON;");
		return new SqliteConnection(db);
	}
}
