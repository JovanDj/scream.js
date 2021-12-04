import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";
import { unlink } from "fs/promises";

describe("SqliteAdapter", () => {
  // let adapter: SqliteAdapter;
  // let connection: SqliteAdapter;
  let db: Database;

  beforeEach(async () => {
    // adapter = new SqliteAdapter();
    // connection = await adapter.connect({ database: "./test.sqlite" });
    db = await open({
      filename: __dirname + "test.sqlite",
      driver: sqlite3.Database,
    });

    await db.exec("CREATE TABLE users (col TEXT)");
    await db.exec('INSERT INTO users VALUES ("test")');
  });

  afterEach(async () => {
    await db.close();
    await unlink(__dirname + "test.sqlite");
  });

  it("should be defined", () => {
    expect(db).toBeInstanceOf(Database);

    // expect(adapter).toBeInstanceOf(SqliteAdapter);
    // expect(connection).toBeInstanceOf(DatabaseConnection);
  });

  it("should be defined", () => {
    expect(db).toBeInstanceOf(Database);

    // expect(adapter).toBeInstanceOf(SqliteAdapter);
    // expect(connection).toBeInstanceOf(DatabaseConnection);
  });
});
