import { Database } from "../lib/database/database.js";
import { Migration } from "../lib/migration.js";

export class TodosMigration implements Migration {
  async up(database: Database) {
    await database.run(`
      CREATE TABLE todos (
        todo_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        due_date TEXT NOT NULL,
        user_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(user_id)
      )`);
  }

  async down(database: Database) {
    await database.run("DROP TABLE todos");
  }
}
