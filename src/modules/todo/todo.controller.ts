import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import { schema } from "@scream.js/validator/schema.js";
import { TodosTable } from "../../tables/todos.table.js";

const todoErrors = (
	issues: readonly { message: string; path: PropertyKey[] }[],
) => {
	const errors: { dueAt?: string; title?: string } = {};

	for (const issue of issues) {
		const key = issue.path.join(".");
		if (key === "title" && errors.title === undefined) {
			errors.title = issue.message;
		}
		if (key === "dueAt" && errors.dueAt === undefined) {
			errors.dueAt = issue.message;
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
		isCompleted: statusCode === "completed" ? true : undefined,
		isOpen: statusCode === "open" ? true : undefined,
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

		const todos = await TodosTable.create(this.#db).list(parsedQuery.data);
		const todoViews = todos.map((todo) => ({
			editUrl: `/todos/${todo.id}/edit`,
			id: todo.id,
			showUrl: `/todos/${todo.id}`,
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
			createTodoUrl: "/todos/create",
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
			hasTodos: todoViews.length > 0 ? true : undefined,
			homeUrl: "/",
			search: parsedQuery.data.search,
			status: parsedQuery.data.status,
			tagsUrl: "/tags",
			todos: todoViews,
			todosUrl: "/todos",
		});
	}

	async show(ctx: HttpContext) {
		const id = this.#parseId(ctx);
		if (id === undefined) {
			return ctx.notFound();
		}

		const todo = await TodosTable.create(this.#db).find(id);
		if (!todo) {
			return ctx.notFound();
		}

		return ctx.render("show", {
			action: `/todos/${todo.id}`,
			editUrl: `/todos/${todo.id}/edit`,
			homeUrl: "/",
			tagsUrl: "/tags",
			todoId: todo.id,
			todoStatusCode: todo.statusCode,
			todosUrl: "/todos",
			todoTitle: todo.title,
		});
	}

	create(ctx: HttpContext) {
		return ctx.render("create", {
			errors: todoErrors([]),
			fields: todoFields({}),
			homeUrl: "/",
			tagsUrl: "/tags",
			todosUrl: "/todos",
		});
	}

	async store(ctx: HttpContext) {
		const body = ctx.body() as { dueAt?: unknown; title?: unknown };
		const dueAt = typeof body.dueAt === "string" ? body.dueAt.trim() : "";
		const title = typeof body.title === "string" ? body.title.trim() : "";

		if (title.length < 1) {
			return ctx.render("create", {
				errors: { title: "Required" },
				fields: todoFields({}),
				homeUrl: "/",
				tagsUrl: "/tags",
				todosUrl: "/todos",
			});
		}

		if (dueAt.length > 0 && Number.isNaN(new Date(dueAt).getTime())) {
			return ctx.render("create", {
				errors: { dueAt: "Invalid date" },
				fields: todoFields({}),
				homeUrl: "/",
				tagsUrl: "/tags",
				todosUrl: "/todos",
			});
		}

		const result = await this.#db.transaction((tx) =>
			TodosTable.create(tx).insert(title),
		);
		return ctx.redirect(`/todos/${result.id}`);
	}

	async edit(ctx: HttpContext) {
		const id = this.#parseId(ctx);
		if (id === undefined) {
			return ctx.notFound();
		}

		const todo = await TodosTable.create(this.#db).find(id);
		if (!todo) {
			return ctx.notFound();
		}

		return ctx.render("edit", {
			action: `/todos/${todo.id}`,
			errors: todoErrors([]),
			fields: todoFields({
				statusCode: todo.statusCode,
				title: todo.title,
			}),
			homeUrl: "/",
			tagsUrl: "/tags",
			todoId: todo.id,
			todosUrl: "/todos",
			todoUrl: `/todos/${todo.id}`,
		});
	}

	async update(ctx: HttpContext) {
		const id = this.#parseId(ctx);
		if (id === undefined) {
			return ctx.notFound();
		}

		const parsed = schema
			.object({
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
				action: `/todos/${id}`,
				errors: todoErrors(parsed.error.issues),
				fields: todoFields({}),
				homeUrl: "/",
				tagsUrl: "/tags",
				todoId: id,
				todosUrl: "/todos",
				todoUrl: `/todos/${id}`,
			});
		}

		const result = await this.#db.transaction((tx) =>
			TodosTable.create(tx).update(id, parsed.data),
		);
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${result.id}`);
	}

	async destroy(ctx: HttpContext) {
		const id = this.#parseId(ctx);
		if (id === undefined) {
			return ctx.notFound();
		}

		const deleted = await this.#db.transaction((tx) =>
			TodosTable.create(tx).delete(id),
		);
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/todos");
	}

	#parseId(ctx: HttpContext) {
		const parsed = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		return parsed.success ? parsed.data : undefined;
	}
}
