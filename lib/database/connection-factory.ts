import { open } from "sqlite";
import sqlite3 from "sqlite3";

sqlite3.verbose();

export type ConnectionOptions = { database: string };

const defaultConnectionOptions: ConnectionOptions = {
  database: ":memory:"
};

export class ConnectionFactory {
  static async createConnection(
    connectionOptions: ConnectionOptions = defaultConnectionOptions
  ) {
    try {
      return open({
        filename: connectionOptions.database,
        driver: sqlite3.cached.Database
      });
    } catch (error) {
      throw error;
    }
  }
}
