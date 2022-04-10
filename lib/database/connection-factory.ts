import { open } from "sqlite";
import sqlite3 from "sqlite3";

export type ConnectionOptions = { database: string };

const defaultConnectionOptions: ConnectionOptions = {
  database: "test-database.db"
};

export class ConnectionFactory {
  static async createConnection(
    connectionOptions: ConnectionOptions = defaultConnectionOptions
  ) {
    try {
      return open({
        filename: connectionOptions.database,
        driver: sqlite3.Database
      });
    } catch (error) {
      console.error(error);
    }
  }
}
