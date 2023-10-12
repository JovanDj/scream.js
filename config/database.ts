import { Database } from "../lib/database/database.js";
import { SqliteDatabase } from "../lib/database/sqlite.js";

export const db: Database = await new SqliteDatabase(
  "migration-test.sqlite",
).connect();
