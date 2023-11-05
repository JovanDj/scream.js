import { Connection } from "@scream.js/database/connection.js";
import { Mapper } from "@scream.js/database/mapper.js";
import type { Repository } from "@scream.js/database/repository.js";
import { Todo } from "./todo.js";
import { TodoRow } from "./todo.row.js";

export class TodoRepository implements Repository<Todo> {
  constructor(
    private readonly _db: Connection,
    private readonly _mapper: Mapper<Todo, TodoRow>
  ) {}

  async findById(id: Todo["id"]) {
    const row = await this._db.get<TodoRow>(
      "SELECT * FROM todos WHERE todo_id = ?",
      [id.toString()]
    );

    if (!row) {
      return;
    }

    return this._mapper.toEntity(row);
  }

  async findAll() {
    const rows = await this._db.all<{
      todo_id: number;
      title: string;
      updated_at: string;
      created_at: string;
      due_date: string;
    }>("SELECT * FROM todos");

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
  delete(): Promise<number> {
    throw new Error("Method not implemented.");
  }
}
