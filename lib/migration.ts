import { Connection } from "./database/connection.js";

export interface Migration {
  up(database: Connection): Promise<void>;
  down(database: Connection): Promise<void>;
}
