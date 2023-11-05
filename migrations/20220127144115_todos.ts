import { Connection } from "@scream.js/database/connection.js";
import { Migration } from "@scream.js/migration.js";

export class TodosMigration implements Migration {
  async up(database: Connection) {
    await database.exec(`
      CREATE TABLE todos (
        todo_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        due_date TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        user_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(user_id)
      )`);
  }

  async down(database: Connection) {
    await database.exec("DROP TABLE todos");
  }
}
