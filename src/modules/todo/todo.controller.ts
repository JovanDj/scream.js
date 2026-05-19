import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import { schema } from "@scream.js/validator/schema.js";

const todoErrors = (
	issues: readonly { message: string; path: PropertyKey[] }[],
) => {
	const errors = { dueAt: "", title: "" };

	for (const issue of issues) {
		const key = issue.path.join(".");
		if (key === "title" || key === "dueAt") {
			errors[key] ||= issue.message;
		}
	}

	return errors;
};

const todoFields = (input: {
	dueAt?: string;
	statusCode?: "completed" | "open";
	title?: string;
}) => {
	const statusCode = input.statusCode ?? "open";

	return {
		dueAt: input.dueAt ?? "",
		isCompleted: statusCode === "completed",
		isOpen: statusCode === "open",
		statusCode,
		title: input.title ?? "",
	};
};

export class TodosController implements Resource {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async index(ctx: HttpContext) {
		const parsedQuery = schema
			.object({
				search: schema
					.string()
					.optional()
					.default("")
					.transform((value) => value.trim()),
				status: schema
					.enum(["all", "completed", "dueToday", "open"])
					.optional()
					.default("all"),
			})
			.safeParse(ctx.query());

		if (!parsedQuery.success) {
			return ctx.notFound();
		}

		const search = parsedQuery.data.search;
		const scope = parsedQuery.data.status;

		const query = this.#db("todos")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.select(
				"todos.id",
				"todos.title",
				this.#db.ref("todo_statuses.code").as("status_code"),
			);

		if (search.length > 0) {
			query.andWhereLike("todos.title", `%${search}%`);
		}
		if (scope === "open") {
			query.where({ "todo_statuses.code": "open" });
		}
		if (scope === "completed") {
			query.where({ "todo_statuses.code": "completed" });
		}
		if (scope === "dueToday") {
			query.where({ "todo_statuses.code": "open" });
			query.whereRaw("date(todos.due_at) = date('now', 'localtime')");
		}
		const todos = schema
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

		const todoViews = todos.map((todo) => ({
			id: todo.id,
			statusCode: todo.statusCode,
			title: todo.title,
		}));

		const createFilterUrl = (input: {
			search: string;
			status: "all" | "completed" | "dueToday" | "open";
		}) => {
			const params = new URLSearchParams();
			if (input.status !== "all") {
				params.set("status", input.status);
			}
			if (input.search.length > 0) {
				params.set("search", input.search);
			}

			const query = params.toString();
			return query.length > 0 ? `/todos?${query}` : "/todos";
		};

		return ctx.render("index", {
			filters: {
				all: createFilterUrl({
					search: parsedQuery.data.search,
					status: "all",
				}),
				completed: createFilterUrl({
					search: parsedQuery.data.search,
					status: "completed",
				}),
				open: createFilterUrl({
					search: parsedQuery.data.search,
					status: "open",
				}),
			},
			pageTitle: "Todos",
			search: parsedQuery.data.search,
			status: parsedQuery.data.status,
			todos: todoViews,
		});
	}

	async show(ctx: HttpContext) {
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
				"todos.id",
				"todos.title",
				this.#db.ref("todo_statuses.code").as("status_code"),
			)
			.first();
		if (!row) {
			return ctx.notFound();
		}
		const todo = {
			id: row.id,
			statusCode: row.status_code,
			title: row.title,
		};

		return ctx.render("show", {
			pageTitle: `Todo | ${todo.id}`,
			todoId: todo.id,
			todoStatusCode: todo.statusCode,
			todoTitle: todo.title,
		});
	}

	async create(ctx: HttpContext) {
		return ctx.render("create", {
			errors: todoErrors([]),
			fields: todoFields({}),
			pageTitle: "New Todo",
		});
	}

	async store(ctx: HttpContext) {
		const body = ctx.body() as { dueAt?: unknown; title?: unknown };
		const dueAt = typeof body.dueAt === "string" ? body.dueAt.trim() : "";
		const title = typeof body.title === "string" ? body.title.trim() : "";

		if (title.length < 1) {
			return ctx.render("create", {
				errors: { dueAt: "", title: "Required" },
				fields: todoFields({}),
				pageTitle: "New Todo",
			});
		}

		if (dueAt.length > 0 && Number.isNaN(new Date(dueAt).getTime())) {
			return ctx.render("create", {
				errors: { dueAt: "Invalid date", title: "" },
				fields: todoFields({}),
				pageTitle: "New Todo",
			});
		}
		const result = await this.#db.transaction(async (tx) => {
			const priority = await tx("todo_priorities")
				.where({ code: "medium" })
				.first("id");
			const status = await tx("todo_statuses")
				.where({ code: "open" })
				.first("id");

			const now = new Date().toISOString();
			const [row] = await tx("todos")
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

			return row;
		});

		return ctx.redirect(`/todos/${result.id}`);
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
				"todos.id",
				"todos.title",
				this.#db.ref("todo_statuses.code").as("status_code"),
			)
			.first();
		if (!row) {
			return ctx.notFound();
		}
		const todo = {
			id: row.id,
			statusCode: row.status_code,
			title: row.title,
		};

		return ctx.render("edit", {
			action: `/todos/${todo.id}`,
			errors: todoErrors([]),
			fields: todoFields({
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
				statusCode: schema.enum(["open", "completed"]).default("open"),
				title: schema
					.string()
					.default("")
					.transform((value) => value.trim())
					.refine((value) => value.length > 0, {
						message: "Required",
					}),
			})
			.safeParse(ctx.body());
		if (!parsed.success) {
			return ctx.render("edit", {
				action: `/todos/${todoId}`,
				errors: todoErrors(parsed.error.issues),
				fields: todoFields({}),
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

			await tx("todos").where({ id: todoId }).update({
				completed_at: completedAt,
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
}
