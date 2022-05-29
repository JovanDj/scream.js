import { open } from "sqlite";
import { Database } from "sqlite3";

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
        driver: Database
      });
    } catch (error) {
      throw error;
    }
  }
}
