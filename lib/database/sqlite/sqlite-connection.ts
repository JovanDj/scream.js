import sqlite from "sqlite";
import { Connection } from "../connection.js";
import { InsertResult } from "../insert-result.js";

export class SqliteConnection implements Connection {
  constructor(private readonly _db: sqlite.Database) {}

  async run(queryString: string, params: string[] = []) {
    const result = await this._db.run(queryString, params);

    return new InsertResult(result.lastID);
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

  async exec(sqlString: string) {
    return this._db.exec(sqlString);
  }

  truncateTable(table: string) {
    return this.exec(`DELETE FROM ${table};`);
  }
}
