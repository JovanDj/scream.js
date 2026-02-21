import type { Knex } from "knex";
import { Todo } from "./todo.js";

type TodoScope = "all" | "completed" | "dueToday" | "open" | "overdue";
type TodoStatusCode = "open" | "completed";

export class TodoService {
	readonly #db: Knex;

	constructor(db: Knex) {
		this.#db = db;
	}

	async findAll(options?: {
		projectId?: number;
		scope?: TodoScope;
		search?: string;
	}) {
		return Todo.findAll(this.#db, options);
	}

	async findById(id: number) {
		return Todo.findById(this.#db, id);
	}

	async create(
		input: Readonly<{
			description: string;
			dueAt: string | null;
			priority: "low" | "medium" | "high";
			projectId: number | null;
			statusCode: TodoStatusCode;
			title: string;
		}>,
	) {
		return this.#db.transaction(async (tx) => {
			return Todo.create(tx, {
				description: input.description,
				dueAt: input.dueAt,
				priority: input.priority,
				projectId: input.projectId,
				statusCode: input.statusCode,
				title: input.title,
			});
		});
	}

	async update(
		id: number,
		input: Readonly<{
			description: string;
			dueAt: string | null;
			priority: "low" | "medium" | "high";
			projectId: number | null;
			statusCode: TodoStatusCode;
			title: string;
			version: number;
		}>,
	) {
		return this.#db.transaction(async (tx) => {
			const todo = await Todo.findById(tx, id);
			if (!todo) {
				return undefined;
			}

			if (todo.version !== input.version) {
				return undefined;
			}

			try {
				return await todo
					.apply({
						description: input.description,
						dueAt: input.dueAt,
						priority: input.priority,
						projectId: input.projectId,
						statusCode: input.statusCode,
						title: input.title,
					})
					.save(tx);
			} catch {
				return undefined;
			}
		});
	}

	async toggle(id: number) {
		return this.#db.transaction(async (tx) => {
			const todo = await Todo.findById(tx, id);
			if (!todo) {
				return undefined;
			}

			const nextStatus: TodoStatusCode =
				todo.statusCode === "completed" ? "open" : "completed";

			try {
				return await todo
					.apply({
						description: todo.description,
						dueAt: todo.dueAt,
						priority: todo.priority,
						projectId: todo.projectId,
						statusCode: nextStatus,
						title: todo.title,
					})
					.save(tx);
			} catch {
				return undefined;
			}
		});
	}

	async delete(id: number) {
		return Todo.deleteById(this.#db, id);
	}
}
