import sqlite from "sqlite";
import { ConnectionOptions } from "../connection-options";
import { Database } from "./database";

export class SqliteDatabase implements Database {
  private db: sqlite.Database;

  constructor(private readonly database: ConnectionOptions["database"]) {}

  async connect() {
    try {
      const db = await sqlite.open({
        filename: this.database,
        driver: sqlite.Database
      });
      this.db = db;
    } catch (err) {
      console.error(err);
    }
  }

  async query(queryString: string, param = "") {
    this.db.exec(queryString, param);
  }

  async close(): Promise<void> {
    this.db.close();
  }
}
