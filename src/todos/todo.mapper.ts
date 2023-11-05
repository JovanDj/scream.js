import { Mapper } from "@scream.js/database/mapper.js";
import { Todo } from "./todo.js";
import { TodoRow } from "./todo.row.js";

export class TodoMapper implements Mapper<Todo, TodoRow> {
  toEntity(row: TodoRow) {
    const todo = new Todo();

    todo.id = row.todo_id;
    todo.title = row.title;
    todo.dueDate = new Date(row.due_date);
    todo.createdAt = new Date(row.created_at);
    todo.updatedAt = new Date(row.updated_at);

    return todo;
  }

  toEntities(rows: TodoRow[]) {
    return rows.map((row) => this.toEntity(row));
  }
}
