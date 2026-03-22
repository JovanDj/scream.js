import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import { createValidator } from "@scream.js/validator/create-validator.js";
import { schema } from "@scream.js/validator/schema.js";

type TodoScope = "all" | "completed" | "dueToday" | "open" | "overdue";

const dueAtValidator = schema
	.string()
	.optional()
	.default("")
	.transform((value) => value.trim())
	.refine(
		(value) => value.length < 1 || !Number.isNaN(new Date(value).getTime()),
		{
			message: "Invalid date",
		},
	)
	.transform((value) => {
		if (value.length < 1) {
			return null;
		}

		return new Date(value).toISOString();
	});

const todoIdValidator = createValidator(
	schema.coerce.number().int().positive(),
);

const todoListQueryValidator = createValidator(
	schema.object({
		projectId: schema.coerce.number().int().positive().optional(),
		search: schema
			.string()
			.optional()
			.default("")
			.transform((value) => value.trim()),
		status: schema
			.enum(["all", "completed", "dueToday", "open", "overdue"])
			.optional()
			.default("all"),
	}),
);

const todoCreateValidator = createValidator(
	schema.strictObject({
		description: schema
			.string()
			.default("")
			.transform((value) => value.trim()),
		dueAt: dueAtValidator,
		priority: schema.enum(["low", "medium", "high"]).default("medium"),
		projectId: schema.preprocess(
			(value) => (value === "" ? undefined : value),
			schema.coerce.number().int().positive().optional(),
		),
		statusCode: schema.enum(["open", "completed"]).default("open"),
		title: schema
			.string()
			.default("")
			.transform((value) => value.trim())
			.refine((value) => value.length > 0, {
				message: "Required",
			}),
	}),
);

const todoUpdateValidator = createValidator(
	schema.strictObject({
		description: schema
			.string()
			.default("")
			.transform((value) => value.trim()),
		dueAt: dueAtValidator,
		priority: schema.enum(["low", "medium", "high"]).default("medium"),
		projectId: schema.preprocess(
			(value) => (value === "" ? undefined : value),
			schema.coerce.number().int().positive().optional(),
		),
		statusCode: schema.enum(["open", "completed"]).default("open"),
		title: schema
			.string()
			.default("")
			.transform((value) => value.trim())
			.refine((value) => value.length > 0, {
				message: "Required",
			}),
	}),
);

const emptyFields = {
	description: "",
	dueAt: "",
	priority: "medium",
	projectId: "",
	statusCode: "open",
	title: "",
} as const;

const toDateInputValue = (value: string | null) => {
	if (!value) {
		return "";
	}

	return value.slice(0, 10);
};

export class TodosController implements Resource {
	async index(ctx: HttpContext) {
		const parsedQuery = ctx.query(todoListQueryValidator);

		if (!parsedQuery.success) {
			return ctx.notFound();
		}

		const options: {
			projectId?: number;
			scope: TodoScope;
			search: string;
		} = {
			scope: parsedQuery.data.status,
			search: parsedQuery.data.search,
		};

		if (parsedQuery.data.projectId !== undefined) {
			options.projectId = parsedQuery.data.projectId;
		}

		const scope = options.scope ?? "all";
		const query = ctx
			.db("todos")
			.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.select(
				"todos.id",
				"todos.title",
				"todos.description",
				"todos.project_id",
				"todos.due_at",
				"todos.completed_at",
				"todos.created_at",
				"todos.updated_at",
				ctx.ref("todo_priorities.code").as("priority_code"),
				ctx.ref("todo_statuses.code").as("status_code"),
			);

		if (options.projectId) {
			query.andWhere({ "todos.project_id": options.projectId });
		}

		if (options.search.trim().length > 0) {
			query.andWhereLike("todos.title", `%${options.search.trim()}%`);
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

		if (scope === "overdue") {
			query.where({ "todo_statuses.code": "open" });
			query.whereRaw("date(todos.due_at) < date('now', 'localtime')");
		}

		const rows = await query.orderBy("todos.id", "desc");
		const todos = schema
			.array(
				schema.object({
					completed_at: schema.string().nullable().optional(),
					created_at: schema.string().optional(),
					description: schema.string().optional(),
					due_at: schema.string().nullable().optional(),
					id: schema.coerce.number(),
					priority_code: schema.enum(["low", "medium", "high"]).optional(),
					project_id: schema.coerce.number().nullable().optional(),
					status_code: schema.enum(["open", "completed"]).optional(),
					title: schema.string().nonempty(),
					updated_at: schema.string().optional(),
				}),
			)
			.parse(rows)
			.map((parsedTodo) => {
				return {
					completedAt: parsedTodo.completed_at ?? null,
					createdAt: parsedTodo.created_at ?? new Date().toISOString(),
					description: parsedTodo.description ?? "",
					dueAt: parsedTodo.due_at ?? null,
					id: parsedTodo.id,
					priority: parsedTodo.priority_code ?? "medium",
					projectId: parsedTodo.project_id ?? null,
					statusCode: parsedTodo.status_code ?? "open",
					title: parsedTodo.title,
					updatedAt: parsedTodo.updated_at ?? new Date().toISOString(),
				};
			});

		const todoViews = todos.map((todo) => ({
			dueDate: toDateInputValue(todo.dueAt),
			id: todo.id,
			priority: todo.priority,
			statusCode: todo.statusCode,
			title: todo.title,
		}));

		const createFilterUrl = (input: {
			projectId: number | undefined;
			search: string;
			status: TodoScope;
		}) => {
			const params = new URLSearchParams();
			if (input.status !== "all") {
				params.set("status", input.status);
			}
			if (input.search.length > 0) {
				params.set("search", input.search);
			}
			if (input.projectId !== undefined) {
				params.set("projectId", input.projectId.toString());
			}

			const query = params.toString();
			return query.length > 0 ? `/todos?${query}` : "/todos";
		};

		return ctx.render("index", {
			filters: {
				all: createFilterUrl({
					projectId: parsedQuery.data.projectId,
					search: parsedQuery.data.search,
					status: "all",
				}),
				completed: createFilterUrl({
					projectId: parsedQuery.data.projectId,
					search: parsedQuery.data.search,
					status: "completed",
				}),
				dueToday: createFilterUrl({
					projectId: parsedQuery.data.projectId,
					search: parsedQuery.data.search,
					status: "dueToday",
				}),
				open: createFilterUrl({
					projectId: parsedQuery.data.projectId,
					search: parsedQuery.data.search,
					status: "open",
				}),
				overdue: createFilterUrl({
					projectId: parsedQuery.data.projectId,
					search: parsedQuery.data.search,
					status: "overdue",
				}),
			},
			pageTitle: "Todos",
			projectId: parsedQuery.data.projectId,
			search: parsedQuery.data.search,
			status: parsedQuery.data.status,
			todos: todoViews,
		});
	}

	async show(ctx: HttpContext) {
		const todoId = ctx.param("id", todoIdValidator);
		if (!todoId) {
			return ctx.notFound();
		}

		const row = await ctx
			.db("todos")
			.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.where({ "todos.id": todoId })
			.select(
				"todos.id",
				"todos.title",
				"todos.description",
				"todos.project_id",
				"todos.due_at",
				"todos.completed_at",
				"todos.created_at",
				"todos.updated_at",
				ctx.ref("todo_priorities.code").as("priority_code"),
				ctx.ref("todo_statuses.code").as("status_code"),
			)
			.first();
		if (!row) {
			return ctx.notFound();
		}

		const parsedTodo = schema
			.object({
				completed_at: schema.string().nullable().optional(),
				created_at: schema.string().optional(),
				description: schema.string().optional(),
				due_at: schema.string().nullable().optional(),
				id: schema.coerce.number(),
				priority_code: schema.enum(["low", "medium", "high"]).optional(),
				project_id: schema.coerce.number().nullable().optional(),
				status_code: schema.enum(["open", "completed"]).optional(),
				title: schema.string().nonempty(),
				updated_at: schema.string().optional(),
			})
			.parse(row);

		const todo = {
			completedAt: parsedTodo.completed_at ?? null,
			createdAt: parsedTodo.created_at ?? new Date().toISOString(),
			description: parsedTodo.description ?? "",
			dueAt: parsedTodo.due_at ?? null,
			id: parsedTodo.id,
			priority: parsedTodo.priority_code ?? "medium",
			projectId: parsedTodo.project_id ?? null,
			statusCode: parsedTodo.status_code ?? "open",
			title: parsedTodo.title,
			updatedAt: parsedTodo.updated_at ?? new Date().toISOString(),
		};
		if (!todo) {
			return ctx.notFound();
		}

		return ctx.render("show", {
			pageTitle: `Todo | ${todo.id}`,
			todoDescription: todo.description,
			todoDueAt: toDateInputValue(todo.dueAt),
			todoId: todo.id,
			todoPriority: todo.priority,
			todoStatusCode: todo.statusCode,
			todoTitle: todo.title,
		});
	}

	async create(ctx: HttpContext) {
		return ctx.render("create", {
			errors: {},
			fields: {
				description: emptyFields.description,
				dueAt: emptyFields.dueAt,
				priority: emptyFields.priority,
				statusCode: emptyFields.statusCode,
				title: emptyFields.title,
			},
			pageTitle: "New Todo",
		});
	}

	async store(ctx: HttpContext) {
		const parsed = ctx.body(todoCreateValidator);
		if (!parsed.success) {
			ctx.unprocessableEntity();
			return ctx.render("create", {
				errors: parsed.errors,
				fields: {
					description: emptyFields.description,
					dueAt: emptyFields.dueAt,
					priority: emptyFields.priority,
					statusCode: emptyFields.statusCode,
					title: emptyFields.title,
				},
				pageTitle: "New Todo",
			});
		}

		const result = await ctx.transaction(async (tx) => {
			const priority = await tx("todo_priorities")
				.where({ code: parsed.data.priority })
				.first("id");
			if (!priority) {
				throw new Error(
					`Todo priority lookup not found: ${parsed.data.priority}`,
				);
			}

			const status = await tx("todo_statuses")
				.where({ code: parsed.data.statusCode })
				.first("id");
			if (!status) {
				throw new Error(
					`Todo status lookup not found: ${parsed.data.statusCode}`,
				);
			}

			const now = new Date().toISOString();
			const [row] = await tx("todos")
				.insert({
					completed_at: parsed.data.statusCode === "completed" ? now : null,
					created_at: now,
					description: parsed.data.description,
					due_at: parsed.data.dueAt,
					priority_id: Number(priority["id"]),
					project_id: parsed.data.projectId ?? null,
					status_id: Number(status["id"]),
					title: parsed.data.title,
					updated_at: now,
				})
				.returning(["id"]);

			return { id: Number(row["id"]) };
		});

		return ctx.redirect(`/todos/${result.id}`);
	}

	async edit(ctx: HttpContext) {
		const todoId = ctx.param("id", todoIdValidator);
		if (!todoId) {
			return ctx.notFound();
		}

		const row = await ctx
			.db("todos")
			.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.where({ "todos.id": todoId })
			.select(
				"todos.id",
				"todos.title",
				"todos.description",
				"todos.project_id",
				"todos.due_at",
				"todos.completed_at",
				"todos.created_at",
				"todos.updated_at",
				ctx.ref("todo_priorities.code").as("priority_code"),
				ctx.ref("todo_statuses.code").as("status_code"),
			)
			.first();
		if (!row) {
			return ctx.notFound();
		}

		const parsedTodo = schema
			.object({
				completed_at: schema.string().nullable().optional(),
				created_at: schema.string().optional(),
				description: schema.string().optional(),
				due_at: schema.string().nullable().optional(),
				id: schema.coerce.number(),
				priority_code: schema.enum(["low", "medium", "high"]).optional(),
				project_id: schema.coerce.number().nullable().optional(),
				status_code: schema.enum(["open", "completed"]).optional(),
				title: schema.string().nonempty(),
				updated_at: schema.string().optional(),
			})
			.parse(row);

		const todo = {
			completedAt: parsedTodo.completed_at ?? null,
			createdAt: parsedTodo.created_at ?? new Date().toISOString(),
			description: parsedTodo.description ?? "",
			dueAt: parsedTodo.due_at ?? null,
			id: parsedTodo.id,
			priority: parsedTodo.priority_code ?? "medium",
			projectId: parsedTodo.project_id ?? null,
			statusCode: parsedTodo.status_code ?? "open",
			title: parsedTodo.title,
			updatedAt: parsedTodo.updated_at ?? new Date().toISOString(),
		};
		if (!todo) {
			return ctx.notFound();
		}

		return ctx.render("edit", {
			action: `/todos/${todo.id}/edit`,
			errors: {},
			fields: {
				description: todo.description,
				dueAt: toDateInputValue(todo.dueAt),
				priority: todo.priority,
				statusCode: todo.statusCode,
				title: todo.title,
			},
			pageTitle: `Edit Todo #${todo.id}`,
			submitLabel: "Update",
			todoId: todo.id,
		});
	}

	async update(ctx: HttpContext) {
		const todoId = ctx.param("id", todoIdValidator);
		if (!todoId) {
			return ctx.notFound();
		}

		const parsed = ctx.body(todoUpdateValidator);
		if (!parsed.success) {
			ctx.unprocessableEntity();
			return ctx.render("edit", {
				action: `/todos/${todoId}/edit`,
				errors: parsed.errors,
				fields: {
					description: emptyFields.description,
					dueAt: emptyFields.dueAt,
					priority: emptyFields.priority,
					statusCode: emptyFields.statusCode,
					title: emptyFields.title,
				},
				pageTitle: `Edit Todo #${todoId}`,
				submitLabel: "Update",
				todoId,
			});
		}

		const result = await ctx.transaction(async (tx) => {
			const currentRow = await tx("todos")
				.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
				.join("todo_statuses", "todos.status_id", "todo_statuses.id")
				.where({ "todos.id": todoId })
				.select(
					"todos.id",
					"todos.title",
					"todos.description",
					"todos.project_id",
					"todos.due_at",
					"todos.completed_at",
					"todos.created_at",
					"todos.updated_at",
					tx.ref("todo_priorities.code").as("priority_code"),
					tx.ref("todo_statuses.code").as("status_code"),
				)
				.first();

			if (!currentRow) {
				return undefined;
			}

			const parsedCurrent = schema
				.object({
					completed_at: schema.string().nullable().optional(),
					created_at: schema.string().optional(),
					description: schema.string().optional(),
					due_at: schema.string().nullable().optional(),
					id: schema.coerce.number(),
					priority_code: schema.enum(["low", "medium", "high"]).optional(),
					project_id: schema.coerce.number().nullable().optional(),
					status_code: schema.enum(["open", "completed"]).optional(),
					title: schema.string().nonempty(),
					updated_at: schema.string().optional(),
				})
				.parse(currentRow);

			const priority = await tx("todo_priorities")
				.where({ code: parsed.data.priority })
				.first("id");
			if (!priority) {
				throw new Error(
					`Todo priority lookup not found: ${parsed.data.priority}`,
				);
			}

			const status = await tx("todo_statuses")
				.where({ code: parsed.data.statusCode })
				.first("id");
			if (!status) {
				throw new Error(
					`Todo status lookup not found: ${parsed.data.statusCode}`,
				);
			}

			const now = new Date().toISOString();
			const completedAt =
				parsed.data.statusCode === "completed"
					? (parsedCurrent.completed_at ?? now)
					: null;

			const affectedRows = await tx("todos")
				.where({ id: todoId })
				.update({
					completed_at: completedAt,
					description: parsed.data.description,
					due_at: parsed.data.dueAt,
					priority_id: Number(priority["id"]),
					project_id: parsed.data.projectId ?? null,
					status_id: Number(status["id"]),
					title: parsed.data.title,
					updated_at: now,
				});

			if (affectedRows === 0) {
				return undefined;
			}

			return { id: todoId };
		});

		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${result.id}`);
	}

	async delete(ctx: HttpContext) {
		const todoId = ctx.param("id", todoIdValidator);
		if (!todoId) {
			return ctx.notFound();
		}

		const affectedRows = await ctx.db("todos").where({ id: todoId }).del();
		const deleted = affectedRows > 0;
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/todos");
	}

	async toggle(ctx: HttpContext) {
		const todoId = ctx.param("id", todoIdValidator);
		if (!todoId) {
			return ctx.notFound();
		}

		const result = await ctx.transaction(async (tx) => {
			const currentRow = await tx("todos")
				.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
				.join("todo_statuses", "todos.status_id", "todo_statuses.id")
				.where({ "todos.id": todoId })
				.select(
					"todos.id",
					"todos.title",
					"todos.description",
					"todos.project_id",
					"todos.due_at",
					"todos.completed_at",
					"todos.created_at",
					"todos.updated_at",
					tx.ref("todo_priorities.code").as("priority_code"),
					tx.ref("todo_statuses.code").as("status_code"),
				)
				.first();

			if (!currentRow) {
				return undefined;
			}

			const parsedCurrent = schema
				.object({
					completed_at: schema.string().nullable().optional(),
					created_at: schema.string().optional(),
					description: schema.string().optional(),
					due_at: schema.string().nullable().optional(),
					id: schema.coerce.number(),
					priority_code: schema.enum(["low", "medium", "high"]).optional(),
					project_id: schema.coerce.number().nullable().optional(),
					status_code: schema.enum(["open", "completed"]).optional(),
					title: schema.string().nonempty(),
					updated_at: schema.string().optional(),
				})
				.parse(currentRow);

			const nextStatusCode =
				parsedCurrent.status_code === "completed" ? "open" : "completed";
			const status = await tx("todo_statuses")
				.where({ code: nextStatusCode })
				.first("id");
			if (!status) {
				throw new Error(`Todo status lookup not found: ${nextStatusCode}`);
			}

			const now = new Date().toISOString();
			const affectedRows = await tx("todos")
				.where({ id: todoId })
				.update({
					completed_at:
						nextStatusCode === "completed"
							? (parsedCurrent.completed_at ?? now)
							: null,
					status_id: Number(status["id"]),
					updated_at: now,
				});

			if (affectedRows === 0) {
				return undefined;
			}

			return { id: todoId };
		});
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${result.id}`);
	}
}
