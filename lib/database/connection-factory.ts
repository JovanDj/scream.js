import { open } from "sqlite";
import sqlite3 from "sqlite3";

sqlite3.verbose();

export interface ConnectionOptions {
  database: string;
}

const defaultConnectionOptions: ConnectionOptions = {
  database: ":memory:",
};

export class ConnectionFactory {
  static async createConnection(
    connectionOptions: ConnectionOptions = defaultConnectionOptions
  ) {
    return open({
      filename: connectionOptions.database,
      driver: sqlite3.cached.Database,
    });
  }
}
