import sqlite, { ISqlite } from "sqlite";
import { Connection } from "../connection.js";
import { InsertResult } from "../insert-result.js";

export class SqliteConnection implements Connection {
  constructor(private readonly _db: sqlite.Database) {}

  /**
   *  Executes multiple queries
   * @param queryString
   * @param params
   */
  async execute(queryString: ISqlite.SqlType) {
    return this._db.exec(queryString);
  }

  async run(queryString: string, params: string[] = []) {
    const result = await this._db.run(queryString, params);

    return new InsertResult(result.lastID, result.changes);
  }

  async all<T>(sqlString: string, params?: string[]) {
    return this._db.all<T>(sqlString, params);
  }

  async get<T>(sqlString: string, params?: string[]) {
    return this._db.get<T>(sqlString, params);
  }

  async close() {
    return this._db.close();
  }

  [Symbol.asyncDispose]() {
    return this.close();
  }
}
