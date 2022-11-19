import { Database } from "sqlite";
import { Migration } from "../lib/migration";

export class TodosMigration implements Migration {
  async up(database: Database) {
    database.exec(`
      CREATE TABLE todos (
        todo_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        due_date TEXT NOT NULL
      )`);
  }

  async down(database: Database) {
    database.exec("DROP TABLE todos");
  }
}
