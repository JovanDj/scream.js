import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Connection } from "../connection.js";
import { Database } from "../database.js";
import { SqliteConnection } from "./sqlite-connection.js";
import { SqliteDatabase } from "./sqlite-database.js";

describe("SqliteDatabase", () => {
  let db: Database;
  let connection: Connection;

  beforeEach(async () => {
    db = new SqliteDatabase();
    connection = await db.connect({ database: ":memory:" });
  });

  afterEach(async () => {
    await connection.close();
  });

  it("creates a connection", () => {
    expect(connection).toBeInstanceOf(SqliteConnection);
  });
});
