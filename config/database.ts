import { Connection } from "@scream.js/database/connection.js";
import { SqliteDatabase } from "@scream.js/database/sqlite/sqlite-database.js";

export const db: Connection = await new SqliteDatabase().connect({
  database: ":memory:",
});
