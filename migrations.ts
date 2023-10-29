import { Connection } from "@scream.js/database/connection.js";
import { SqliteDatabase } from "@scream.js/database/sqlite/sqlite-database.js";
import { Migration } from "@scream.js/migration.js";
import { readdir } from "node:fs/promises";

const database = new SqliteDatabase();
const connection = await database.connect({
  database: "migration-test.sqlite",
});

try {
  // Read the files in the migrations folder
  const files = await readdir("./migrations/");
  // Import each file and run its methods
  console.log("Migrating:", files.length);

  await connection.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      name TEXT NOT NULL
    )
  `);

  for (const file of files) {
    const module = await import(`./migrations/${file}`);

    // Loop through the module and run methods
    for (const key of Object.keys(module)) {
      console.log("Migrating: ", key);
      const migrationClass = module[key];
      const migration: Migration = new migrationClass();

      console.log({ migrationClass });
      await migrate(migration, connection);

      await connection.run(
        `
        INSERT INTO migrations(date, name) VALUES(?, ?)
      `,
        [new Date().toISOString(), key]
      );

      console.log("Migrated: ", migrationClass.name);
    }
  }
} catch (error) {
  console.error("Error while importing and running migrations:", error);
} finally {
  await connection.close();
}

async function migrate(migration: Migration, connection: Connection) {
  try {
    await migration.up(connection);
  } catch (error) {
    await migration.down(connection);
    console.error(error);
  }
}
