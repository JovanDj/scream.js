import { ConnectionOptions } from "./connection-options";
import { DatabaseConnection } from "./database-connection";

export abstract class DatabaseAdapter {
  abstract connect(options: ConnectionOptions): Promise<DatabaseConnection>;
  // abstract disconnect(): void;
  // abstract execute(): void;
  // abstract query(): void;
}
