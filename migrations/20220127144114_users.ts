import { Connection } from "@scream.js/database/connection.js";
import { Migration } from "@scream.js/migration.js";

export class UsersMigration implements Migration {
  private readonly _table = "users";

  async up(database: Connection) {
    await database.exec(`
      CREATE TABLE ${this._table} (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL
      )`);
  }

  async down(database: Connection) {
    await database.exec(`DROP TABLE ${this._table}`);
  }
}
