import { KnexDataMapper } from "@scream.js/database/knex-data-mapper.js";
import { Knex } from "knex";
import { Todo } from "./todo.js";
import { TodoRow } from "./todo.row.js";

export class TodoMapper extends KnexDataMapper<Todo, TodoRow> {
  protected override primaryKey = "todo_id";
  protected override tableName = "todos";

  constructor(protected override readonly _db: Knex) {
    super(_db);
  }

  toEntity(row: TodoRow) {
    const todo = new Todo();

    todo.id = row.todo_id;
    todo.title = row.title;
    todo.dueDate = new Date(row.due_date);
    todo.createdAt = new Date(row.created_at);
    todo.updatedAt = new Date(row.updated_at);

    return todo;
  }

  toRow(entity: Partial<Todo>): Partial<TodoRow> {
    return {
      created_at: entity.createdAt?.toISOString() ?? new Date().toISOString(),
      due_date: entity.dueDate?.toISOString() ?? new Date().toISOString(),
      title: entity.title ?? "",
      updated_at: entity.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
