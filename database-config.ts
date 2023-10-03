import { Database } from "./lib/database/database.js";
import { SqliteDatabase } from "./lib/database/sqlite.js";

await using db: Database = await new SqliteDatabase(
  "migration-test.sqlite",
).connect();

export { db };
