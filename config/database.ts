import { Database } from "@scream.js/database/database.js";
import { SqliteDatabase } from "@scream.js/database/sqlite.js";

export const db: Database = await new SqliteDatabase(
  "migration-test.sqlite",
).connect();
