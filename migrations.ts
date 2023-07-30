import { readdir } from "node:fs/promises";
import { Database } from "./lib/database/database.js";
import { SqliteDatabase } from "./lib/database/sqlite.js";
import { Migration } from "./lib/migration.js";

const database = new SqliteDatabase("migration-test.sqlite");

try {
  // Read the files in the migrations folder
  const files = await readdir("./migrations/");
  // Import each file and run its methods
  console.log("Migrating:", files.length);

  for (const file of files) {
    const module = await import(`./migrations/${file}`);

    // Loop through the module and run methods
    for (const key of Object.keys(module)) {
      console.log("Migrating: ", key);
      const migrationClass = module[key];
      const migration: Migration = new migrationClass();

      await migrate(migration, database);
      console.log("Migrated: ", key);
    }
  }
} catch (error) {
  console.error("Error while importing and running migrations:", error);
} finally {
  await database.close();
}

async function migrate(migration: Migration, database: Database) {
  await database.connect();

  try {
    await migration.up(database);
  } catch (error) {
    await migration.down(database);
    console.error(error);
  }
}
