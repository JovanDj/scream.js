import type { Database } from "@scream.js/database/db.js";
import { schema } from "@scream.js/validator/schema.js";

export type Todo = {
	readonly id: number;
	readonly statusCode: "completed" | "open";
	readonly title: string;
};

export class TodosTable {
	readonly #db: Database;

	static create(db: Database) {
		return new TodosTable(db);
	}

	private constructor(db: Database) {
		this.#db = db;
	}

	async list(input: {
		search: string;
		status: "all" | "completed" | "dueToday" | "open";
	}): Promise<readonly Todo[]> {
		const query = this.#db("todos")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.select(
				"todos.id",
				"todos.title",
				this.#db.ref("todo_statuses.code").as("status_code"),
			);

		if (input.search.length > 0) {
			query.andWhereLike("todos.title", `%${input.search}%`);
		}
		if (input.status === "open") {
			query.where({ "todo_statuses.code": "open" });
		}
		if (input.status === "completed") {
			query.where({ "todo_statuses.code": "completed" });
		}
		if (input.status === "dueToday") {
			query.where({ "todo_statuses.code": "open" });
			query.whereRaw("date(todos.due_at) = date('now', 'localtime')");
		}

		return schema
			.array(
				schema.object({
					id: schema.coerce.number().int().positive(),
					status_code: schema.enum(["open", "completed"]),
					title: schema.string().nonempty(),
				}),
			)
			.transform((rows) =>
				rows.map((row) => ({
					id: row.id,
					statusCode: row.status_code,
					title: row.title,
				})),
			)
			.parse(await query.orderBy("todos.id", "desc"));
	}

	async find(id: number): Promise<Todo | undefined> {
		const row = await this.#db("todos")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.where({ "todos.id": id })
			.select(
				"todos.id",
				"todos.title",
				this.#db.ref("todo_statuses.code").as("status_code"),
			)
			.first();

		if (!row) {
			return undefined;
		}

		return schema
			.object({
				id: schema.coerce.number().int().positive(),
				status_code: schema.enum(["open", "completed"]),
				title: schema.string().nonempty(),
			})
			.transform((todo) => ({
				id: todo.id,
				statusCode: todo.status_code,
				title: todo.title,
			}))
			.parse(row);
	}

	async insert(title: string) {
		const priority = await this.#db("todo_priorities")
			.where({ code: "medium" })
			.first("id");
		const status = await this.#db("todo_statuses")
			.where({ code: "open" })
			.first("id");
		const now = new Date().toISOString();
		const [row] = await this.#db("todos")
			.insert({
				completed_at: null,
				created_at: now,
				description: "",
				due_at: null,
				priority_id: priority.id,
				status_id: status.id,
				title,
				updated_at: now,
			})
			.returning(["id"]);

		return { id: row.id as number };
	}

	async update(
		id: number,
		input: { statusCode: "completed" | "open"; title: string },
	) {
		const current = await this.#db("todos")
			.where({ "todos.id": id })
			.select("todos.completed_at")
			.first();
		if (!current) {
			return undefined;
		}

		const priority = await this.#db("todo_priorities")
			.where({ code: "medium" })
			.first("id");
		const status = await this.#db("todo_statuses")
			.where({ code: input.statusCode })
			.first("id");
		const now = new Date().toISOString();
		const completedAt =
			input.statusCode === "completed" ? (current.completed_at ?? now) : null;

		await this.#db("todos").where({ id }).update({
			completed_at: completedAt,
			priority_id: priority.id,
			status_id: status.id,
			title: input.title,
			updated_at: now,
		});

		return { id };
	}

	async delete(id: number) {
		return (await this.#db("todos").where({ id }).del()) > 0;
	}

	async touch(id: number) {
		return (
			(await this.#db("todos").where({ id }).update({
				updated_at: new Date().toISOString(),
			})) > 0
		);
	}
}
