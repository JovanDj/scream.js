import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import { schema } from "@scream.js/validator/schema.js";
import type { TodoModel } from "./todo.model.js";

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
	readonly #todos: TodoModel;

	constructor(todos: TodoModel) {
		this.#todos = todos;
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

		const todos = this.#todos.list({ scope, search });

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

		const todo = this.#todos.find(todoId);
		if (todo === undefined) {
			return ctx.notFound();
		}

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
		const todoId = this.#todos.create({ title });

		return ctx.redirect(`/todos/${todoId}`);
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

		const todo = this.#todos.find(todoId);
		if (todo === undefined) {
			return ctx.notFound();
		}

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

		const result = this.#todos.update({
			id: todoId,
			statusCode: parsed.data.statusCode,
			title: parsed.data.title,
		});

		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${result}`);
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

		const deleted = this.#todos.destroy(todoId);
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/todos");
	}
}
