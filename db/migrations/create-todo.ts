import sqlite3, { Database } from "sqlite3";

sqlite3.verbose();
const database: Database = sqlite3
  .verbose()
  .cached.Database("app.sqlite", (err: Error | null) => {
    if (err) {
      throw err;
    }

    console.log("Connected to the app database.");
  });

database.on("trace", (sql: string) => {
  console.log(sql);
});

database.on("profile", (sql: string, time: number) => {
  console.log(sql, time);
});

database.serialize(() => {
  database.run("BEGIN TRANSACTION");
  database.run("DROP TABLE IF EXISTS todos");
  database.run(
    `CREATE TABLE IF NOT EXISTS todos (
        todo_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        description TEXT NOT NULL
    );`
  );
  database.run("COMMIT");
});

database.close((err: Error | null) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Close the database connection.");
});
