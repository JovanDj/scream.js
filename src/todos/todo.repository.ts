import { Database } from "../../lib/database/database.js";
import { Entity } from "../../lib/database/entity.js";
import type { Repository } from "../../lib/database/repository.js";
import { Todo } from "./todo.js";

export class TodoRepository implements Repository<Todo> {
  constructor(private readonly db: Database) {}

  async findById(id: Entity["id"]) {
    await this.db.connect();

    let row:
      | {
          todo_id: number;
          title: string;
          updated_at: string;
          created_at: string;
          due_date: string;
        }
      | undefined;

    try {
      row = await this.db.get<{
        todo_id: number;
        title: string;
        updated_at: string;
        created_at: string;
        due_date: string;
      }>("SELECT * FROM todos WHERE todo_id = ?", [id.toString()]);
    } catch (error) {
      throw error;
    } finally {
      await this.db.close();
    }

    if (!row) {
      return undefined;
    }

    const todo = new Todo();

    todo.id = row["todo_id"];
    todo.title = row["title"];
    todo.updatedAt = new Date(row["updated_at"]);
    todo.createdAt = new Date(row["created_at"]);
    todo.dueDate = new Date(row["due_date"]);

    return todo;
  }

  async findAll() {
    await this.db.connect();

    const rows = await this.db.all<{
      todo_id: number;
      title: string;
      updated_at: string;
      created_at: string;
      due_date: string;
    }>("SELECT * FROM todos");

    await this.db.close();

    const todos = rows.map((row) => {
      const todo = new Todo();
      todo.id = row["todo_id"];
      todo.title = row["title"];
      todo.updatedAt = new Date(row["updated_at"]);
      todo.createdAt = new Date(row["created_at"]);
      todo.dueDate = new Date(row["due_date"]);

      return todo;
    });

    return todos;
  }

  async insert(todo: Todo) {
    await this.db.connect();

    const result = await this.db.run(
      "INSERT INTO todos(title, due_date, updated_at, created_at) VALUES(?, ?, ?, ?) ",
      [
        todo.title,
        new Date().toISOString(),
        new Date().toISOString(),
        todo.dueDate.toISOString(),
      ],
    );

    await this.db.close();

    return result;
  }

  update(): Promise<number> {
    throw new Error("Method not implemented.");
  }
  delete(): Promise<number> {
    throw new Error("Method not implemented.");
  }
}
