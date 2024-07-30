import { Knex } from "knex";

declare module "knex/types/tables.js" {
  interface TodoRow {
    todo_id: number;
    title: string;
    due_date: string;
    created_at: string;
    updated_at: string;
  }

  interface Tables {
    todos: Knex.CompositeTableType<
      TodoRow, // Use for SELECT and WHERE
      Partial<Pick<TodoRow, "due_date" | "title">>, // Use for INSERT
      Partial<Omit<TodoRow, "id">> // Use for UPDATE
    >;
  }
}
