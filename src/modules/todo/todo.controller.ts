import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type {
	Create,
	Destroy,
	Edit,
	Update,
} from "@scream.js/http/resource.js";
import { schema } from "@scream.js/validator/schema.js";

export class TodosController implements Create, Destroy, Edit, Update {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async create(ctx: HttpContext) {
		return ctx.render("create", {
			errors: this.#todoErrors([]),
			fields: this.#todoFields({}),
			pageTitle: "New Todo",
		});
	}

	async edit(ctx: HttpContext) {
		const parsedTodoId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}
		const todoId = parsedTodoId.data;

		const row = await this.#db("todos")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.where({ "todos.id": todoId })
			.select(
				"todos.due_at",
				"todos.id",
				"todos.title",
				this.#db.ref("todo_statuses.code").as("status_code"),
			)
			.first();
		if (!row) {
			return ctx.notFound();
		}
		const todo = {
			dueAt: row.due_at,
			id: row.id,
			statusCode: row.status_code,
			title: row.title,
		};

		return ctx.render("edit", {
			action: `/todos/${todo.id}`,
			errors: this.#todoErrors([]),
			fields: this.#todoFields({
				dueAt: todo.dueAt ?? "",
				statusCode: todo.statusCode,
				title: todo.title,
			}),
			pageTitle: `Edit Todo #${todo.id}`,
			submitLabel: "Update",
			todoId: todo.id,
		});
	}

	async update(ctx: HttpContext) {
		const parsedTodoId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}
		const todoId = parsedTodoId.data;

		const parsed = schema
			.object({
				dueAt: schema
					.string()
					.default("")
					.transform((value) => value.trim())
					.refine((value) => this.#isValidDueDate(value), {
						message: "Invalid date",
					}),
				statusCode: schema.enum(["open", "completed"]).default("open"),
				title: schema
					.string()
					.default("")
					.transform((value) => value.trim())
					.refine((value) => value.length > 0, { message: "Required" }),
			})
			.safeParse(ctx.body());
		if (!parsed.success) {
			return ctx.render("edit", {
				action: `/todos/${todoId}`,
				errors: this.#todoErrors(parsed.error.issues),
				fields: this.#todoFields({}),
				pageTitle: `Edit Todo #${todoId}`,
				submitLabel: "Update",
				todoId,
			});
		}

		const result = await this.#db.transaction(async (tx) => {
			const currentRow = await tx("todos")
				.where({ "todos.id": todoId })
				.select("todos.completed_at")
				.first();
			if (!currentRow) {
				return undefined;
			}

			const priority = await tx("todo_priorities")
				.where({ code: "medium" })
				.first("id");
			const status = await tx("todo_statuses")
				.where({ code: parsed.data.statusCode })
				.first("id");
			const now = new Date().toISOString();
			const completedAt =
				parsed.data.statusCode === "completed"
					? (currentRow.completed_at ?? now)
					: null;

			await tx("todos")
				.where({ id: todoId })
				.update({
					completed_at: completedAt,
					due_at: parsed.data.dueAt.length > 0 ? parsed.data.dueAt : null,
					priority_id: priority.id,
					status_id: status.id,
					title: parsed.data.title,
					updated_at: now,
				});

			return { id: todoId };
		});
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${result.id}`);
	}

	async destroy(ctx: HttpContext) {
		const parsedTodoId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}
		const todoId = parsedTodoId.data;

		const deleted = (await this.#db("todos").where({ id: todoId }).del()) > 0;
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/todos");
	}

	#isValidDueDate(value: string) {
		return value.length === 0 || schema.iso.date().safeParse(value).success;
	}

	#todoErrors(issues: readonly { message: string; path: PropertyKey[] }[]) {
		const errors = { dueAt: "", title: "" };

		for (const issue of issues) {
			const key = issue.path.join(".");
			if (key === "title" || key === "dueAt") {
				errors[key] ||= issue.message;
			}
		}

		return errors;
	}

	#todoFields(input: {
		dueAt?: string;
		statusCode?: "completed" | "open";
		title?: string;
	}) {
		const statusCode = input.statusCode ?? "open";

		return {
			dueAt: input.dueAt ?? "",
			isCompleted: statusCode === "completed",
			isOpen: statusCode === "open",
			statusCode,
			title: input.title ?? "",
		};
	}
}
