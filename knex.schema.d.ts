import type { Knex } from "knex";

declare module "knex/types/tables.js" {
	interface TodoRow {
		id: number;
		title: string;
		user_id: UserRow["id"];
	}

	interface UserRow {
		id: number;
		username: string;
	}

	interface Tables {
		todos: Knex.CompositeTableType<
			TodoRow, // Use for SELECT and WHERE
			Partial<Pick<TodoRow, "due_date" | "title">>, // Use for INSERT
			Partial<Omit<TodoRow, "id">> // Use for UPDATE
		>;

		users: Knex.CompositeTableType<
			UserRow, // Use for SELECT and WHERE
			Partial<Pick<TodoRow, "username">>, // Use for INSERT
			Partial<Omit<TodoRow, "id">> // Use for UPDATE
		>;
	}
}
