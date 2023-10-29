import { Connection } from "@scream.js/database/connection.js";
import { Entity } from "@scream.js/database/entity.js";
import type { Repository } from "@scream.js/database/repository.js";
import { Todo } from "./todo.js";

export class TodoRepository implements Repository<Todo> {
  constructor(private readonly _db: Connection) {}

  async findById(id: Entity["id"]) {
    const row = await this._db.get<{
      todo_id: number;
      title: string;
      updated_at: string;
      created_at: string;
      due_date: string;
    }>("SELECT * FROM todos WHERE todo_id = ?", [id.toString()]);

    if (!row) {
      return;
    }

    console.log({ row });
    const todo = new Todo();

    todo.id = row.todo_id;
    todo.title = row.title;
    todo.updatedAt = new Date(row.updated_at);
    todo.createdAt = new Date(row.created_at);
    todo.dueDate = new Date(row.due_date);

    return todo;
  }

  async findAll() {
    const rows = await this._db.all<{
      todo_id: number;
      title: string;
      updated_at: string;
      created_at: string;
      due_date: string;
    }>("SELECT * FROM todos");

    const todos = rows.map((row) => {
      const todo = new Todo();
      todo.id = row.todo_id;
      todo.title = row.title;
      todo.updatedAt = new Date(row.updated_at);
      todo.createdAt = new Date(row.created_at);
      todo.dueDate = new Date(row.due_date);

      return todo;
    });

    return todos;
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

  update(): Promise<number> {
    throw new Error("Method not implemented.");
  }
  delete(): Promise<number> {
    throw new Error("Method not implemented.");
  }
}
