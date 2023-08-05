import { Database as sqliteDB, type ISqlite } from "sqlite";
import sqlite3 from "sqlite3";
import { ConnectionOptions } from "../connection-options.js";
import { Database } from "./database.js";

export class SqliteDatabase implements Database {
  private readonly _db;

  constructor(
    private readonly database: ConnectionOptions["database"] = ":memory:",
  ) {
    this._db = new sqliteDB({
      driver: sqlite3.Database,
      filename: this.database,
    });
  }

  get db() {
    return this._db;
  }

  async connect() {
    await this.db.open();
    await this.db.run("PRAGMA foreign_keys = ON;");
  }

  /**
   *  Executes multiple queries
   * @param queryString
   * @param params
   */
  async execute(queryString: ISqlite.SqlType) {
    return this.db.exec(queryString);
  }

  async run(queryString: string, params: string[] = []) {
    await this.db.run(queryString, params);
    return this;
  }

  async all<T>(sqlString: string, params?: string[] | undefined) {
    return this.db.all<T>(sqlString, params);
  }

  async get<T>(sqlString: string, params: string[] = []) {
    return this.db.get<T>(sqlString, params);
  }

  async close() {
    return this.db.close();
  }
}
