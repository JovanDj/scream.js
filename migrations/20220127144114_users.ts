import { Database } from "../lib/database/database.js";
import { Migration } from "../lib/migration.js";

export class UsersMigration implements Migration {
  async up(database: Database) {
    await database.run(`
      CREATE TABLE users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL
      )`);
  }

  async down(database: Database) {
    await database.run("DROP TABLE users");
  }
}
