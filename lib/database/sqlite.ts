import { Database as sqliteDB, type ISqlite } from "sqlite";
import { type ConnectionOptions } from "../connection-options";
import sqlite3 from "sqlite3";
import type { Database } from "./database";

export class SqliteDatabase implements Database {
  private readonly _db;

  constructor(
    private readonly database: ConnectionOptions["database"] = ":memory:"
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
    return this.db.open();
  }

  /**
   *  Executes multiple queries
   * @param queryString
   * @param params
   * @returns Database
   */
  async execute(queryString: ISqlite.SqlType, params: string[] = []) {
    return this.db.exec(queryString, params);
  }

  /**
   * Execute single query
   * @param queryString
   * @param params
   * @returns
   */
  async run(queryString: ISqlite.SqlType, params: string[] = []) {
    return this.db.run(queryString, params);
  }

  async all(queryString: ISqlite.SqlType, params: string[] = []) {
    return this.db.all(queryString, params);
  }

  async close() {
    return this.db.close();
  }
}
