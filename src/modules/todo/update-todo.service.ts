import type {
	CommandHandler,
	CommandHandlerFactory,
} from "@scream.js/database/command-handler.js";
import type { Database } from "@scream.js/database/db.js";
import { schema } from "@scream.js/validator/schema.js";
import type { TodoShowInput, TodoUpdateInput } from "./todo.schema.js";

export type UpdateTodo = TodoShowInput & TodoUpdateInput;

export class UpdateTodoService
	implements CommandHandler<UpdateTodo, { id: number } | undefined>
{
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute(input: UpdateTodo) {
		const currentRow = await this.#db("todos")
			.where({ "todos.id": input.id })
			.select("todos.completed_at")
			.first();
		if (!currentRow) {
			return undefined;
		}
		const current = schema
			.object({ completed_at: schema.string().nullable() })
			.parse(currentRow);

		const priorityRow = await this.#db("todo_priorities")
			.where({ code: "medium" })
			.first("id");
		const statusRow = await this.#db("todo_statuses")
			.where({ code: input.statusCode })
			.first("id");
		const idRowSchema = schema.object({
			id: schema.coerce.number().int().positive(),
		});
		const priority = idRowSchema.parse(priorityRow);
		const status = idRowSchema.parse(statusRow);
		const now = new Date().toISOString();
		const completedAt =
			input.statusCode === "completed" ? (current.completed_at ?? now) : null;

		await this.#db("todos")
			.where({ id: input.id })
			.update({
				completed_at: completedAt,
				due_at: input.dueAt.length > 0 ? input.dueAt : null,
				priority_id: priority.id,
				status_id: status.id,
				title: input.title,
				updated_at: now,
			});

		return { id: input.id };
	}
}

export class UpdateTodoServiceFactory
	implements CommandHandlerFactory<UpdateTodo, { id: number } | undefined>
{
	create(tx: Database) {
		return new UpdateTodoService(tx);
	}
}
