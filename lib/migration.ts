import { Database } from "sqlite";

export interface Migration {
  up(database: Database): Promise<void>;
  down(database: Database): Promise<void>;
}
