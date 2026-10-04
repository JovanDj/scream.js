import type {
	CommandHandler,
	CommandHandlerFactory,
} from "@scream.js/database/command-handler.js";
import type { Database } from "@scream.js/database/db.js";
import { schema } from "@scream.js/validator/schema.js";
import type { TodoStoreInput } from "../todo.schema.js";

export class CreateTodoService
	implements CommandHandler<TodoStoreInput, number>
{
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute(input: TodoStoreInput) {
		const idRowSchema = schema.object({
			id: schema.coerce.number().int().positive(),
		});
		const priorityRow = await this.#db("todo_priorities")
			.where({ code: "medium" })
			.first("id");
		const statusRow = await this.#db("todo_statuses")
			.where({ code: "open" })
			.first("id");
		const priority = idRowSchema.parse(priorityRow);
		const status = idRowSchema.parse(statusRow);
		const now = new Date().toISOString();
		const [row] = await this.#db("todos")
			.insert({
				completed_at: null,
				created_at: now,
				description: "",
				due_at: input.dueAt.length > 0 ? input.dueAt : null,
				priority_id: priority.id,
				status_id: status.id,
				title: input.title,
				updated_at: now,
			})
			.returning(["id"]);
		return idRowSchema.parse(row).id;
	}
}

export class CreateTodoServiceFactory
	implements CommandHandlerFactory<TodoStoreInput, number>
{
	create(tx: Database) {
		return new CreateTodoService(tx);
	}
}
