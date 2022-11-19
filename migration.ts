import("./migrations/20220127144115_todos").then(async m => {
  const migration = new m.TodosMigration();

  const db = await Data;
});
