import { DatabaseAccess } from "@scream.js/database/database-facade.js";
import { Mapper } from "@scream.js/database/mapper.js";
import type { Repository } from "@scream.js/database/repository.js";
import { Todo } from "./todo.js";
import { TodoRow } from "./todo.row.js";

export class TodoRepository implements Repository<Todo> {
  constructor(
    private readonly _db: DatabaseAccess,
    private readonly _mapper: Mapper<Todo, TodoRow>
  ) {}

  async findById(id: Todo["id"]) {
    const sql = this._db
      .select(["*"])
      .from("todos")
      .where("todo_id = ?")
      .build();

    const row = await this._db.get<TodoRow>(sql, [id.toString()]);

    return row ? this._mapper.toEntity(row) : undefined;
  }

  async findAll() {
    const sql = this._db.select(["*"]).from("todos").build();
    const rows = await this._db.all<TodoRow>(sql);

    return this._mapper.toEntities(rows);
  }

  async insert(todo: Todo) {
    const result = await this._db.run(
      "INSERT INTO todos(title, due_date, updated_at, created_at) VALUES(?, ?, ?, ?) ",
      [
        todo.title,
        new Date().toISOString(),
        new Date().toISOString(),
        todo.dueDate.toISOString(),
      ]
    );

    return result;
  }

  async update(id: Todo["id"], todo: Partial<Todo>) {
    await this._db.run("UPDATE todos SET title = ? WHERE todo_id = ?", [
      todo.title ?? "",
      id.toString(),
    ]);

    return id;
  }

  async delete(id: Todo["id"]) {
    const result = await this._db.run("DELETE FROM todos WHERE todo_id = ?", [
      id.toString(),
    ]);
    return result.lastId ?? 0;
  }
}
