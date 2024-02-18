import { Knex } from "knex";

declare module "knex/types/tables.js" {
  interface Todo {
    todo_id: number;
    title: string;
    due_date: string;
    created_at: string;
    updated_at: string;
  }

  interface Tables {
    todos: Knex.CompositeTableType<
      Todo, // Use for SELECT and WHERE
      Partial<Pick<Todo, "due_date" | "title">>, // Use for INSERT
      Partial<Omit<Todo, "id">> // Use for UPDATE
    >;
  }
}
