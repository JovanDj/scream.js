import { DatabaseAdapter } from "./database-adapter";
import { Database, open } from "sqlite";
import { ConnectionOptions } from "./connection-options";
import sqlite3 from "sqlite3";

export class SqliteAdapter extends DatabaseAdapter {
  private db?: Database;
  constructor() {
    super();
  }

  async connect(options: ConnectionOptions): Promise<SqliteAdapter> {
    this.db = open({
      filename: options.database,
      driver: sqlite3.Database,
    });

    return this;
  }

  async query(query: string) {
    this.db.exec(query);
  }
}
