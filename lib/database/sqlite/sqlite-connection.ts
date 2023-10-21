import sqlite, { ISqlite } from "sqlite";
import { Connection } from "../connection.js";
import { InsertResult } from "../insert-result.js";

export class SqliteConnection implements Connection {
  constructor(private readonly db: sqlite.Database) {}

  /**
   *  Executes multiple queries
   * @param queryString
   * @param params
   */
  async execute(queryString: ISqlite.SqlType) {
    return this.db.exec(queryString);
  }

  async run(queryString: string, params: string[] = []) {
    const result = await this.db.run(queryString, params);

    return new InsertResult(result.lastID, result.changes);
  }

  async all<T>(sqlString: string, params?: string[]) {
    return this.db.all<T>(sqlString, params);
  }

  async get<T>(sqlString: string, params?: string[]) {
    return this.db.get<T>(sqlString, params);
  }

  async close() {
    return this.db.close();
  }

  [Symbol.asyncDispose]() {
    return this.close();
  }
}
