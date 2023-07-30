import { Database } from "./database/database.js";

export interface Migration {
  up(database: Database): Promise<void>;
  down(database: Database): Promise<void>;
}
