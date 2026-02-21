import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import type { TodoService } from "./todo.service.js";

type TodoScope = "all" | "completed" | "dueToday" | "open" | "overdue";

const emptyFields = {
	description: "",
	dueAt: "",
	priority: "medium",
	projectId: "",
	statusCode: "open",
	title: "",
	version: 0,
} as const;

const toDateInputValue = (value: string | null) => {
	if (!value) {
		return "";
	}

	return value.slice(0, 10);
};

const normalizeDueAt = (value: string) => {
	const trimmed = value.trim();
	if (trimmed.length < 1) {
		return null;
	}

	const parsed = new Date(trimmed);
	if (Number.isNaN(parsed.getTime())) {
		return undefined;
	}

	return parsed.toISOString();
};

export class TodosController implements Resource {
	readonly #todoService: TodoService;

	constructor(todoService: TodoService) {
		this.#todoService = todoService;
	}

	#parseTodoId(ctx: HttpContext) {
		const parsedId = ctx.param("id", (z) => z.coerce.number().int().positive());
		if (!parsedId.success) {
			return undefined;
		}

		return parsedId.data;
	}

	async #renderIndexForScope(ctx: HttpContext, scope: TodoScope) {
		const parsedQuery = ctx.query((z) =>
			z.object({
				projectId: z.coerce.number().int().positive().optional(),
				search: z
					.string()
					.optional()
					.default("")
					.transform((value) => value.trim()),
			}),
		);

		if (!parsedQuery.success) {
			return ctx.notFound();
		}

		const options: {
			projectId?: number;
			scope: TodoScope;
			search: string;
		} = {
			scope,
			search: parsedQuery.data.search,
		};

		if (parsedQuery.data.projectId !== undefined) {
			options.projectId = parsedQuery.data.projectId;
		}

		const todos = await this.#todoService.findAll(options);
		const todoViews = todos.map((todo) => ({
			dueDate: toDateInputValue(todo.dueAt),
			id: todo.id,
			priority: todo.priority,
			statusCode: todo.statusCode,
			title: todo.title,
		}));

		return ctx.render("index", {
			filters: {
				base: "/todos",
				completed: "/todos/completed",
				dueToday: "/todos/due-today",
				open: "/todos/open",
				overdue: "/todos/overdue",
			},
			pageTitle: "Todos",
			scope,
			search: parsedQuery.data.search,
			todos: todoViews,
		});
	}

	async index(ctx: HttpContext) {
		return this.#renderIndexForScope(ctx, "all");
	}

	async open(ctx: HttpContext) {
		return this.#renderIndexForScope(ctx, "open");
	}

	async completed(ctx: HttpContext) {
		return this.#renderIndexForScope(ctx, "completed");
	}

	async dueToday(ctx: HttpContext) {
		return this.#renderIndexForScope(ctx, "dueToday");
	}

	async overdue(ctx: HttpContext) {
		return this.#renderIndexForScope(ctx, "overdue");
	}

	async show(ctx: HttpContext) {
		const todoId = this.#parseTodoId(ctx);
		if (!todoId) {
			return ctx.notFound();
		}

		const todo = await this.#todoService.findById(todoId);
		if (!todo) {
			return ctx.notFound();
		}

		return ctx.render("show", {
			pageTitle: `Todo | ${todo.id}`,
			todo,
			todoDescription: todo.description,
			todoDueAt: toDateInputValue(todo.dueAt),
			todoId: todo.id,
			todoPriority: todo.priority,
			todoProjectId: todo.projectId,
			todoStatusCode: todo.statusCode,
			todoTitle: todo.title,
			todoVersion: todo.version,
		});
	}

	async create(ctx: HttpContext) {
		return ctx.render("create", { errors: {}, fields: emptyFields });
	}

	async store(ctx: HttpContext) {
		const parsed = ctx.body((z) =>
			z.strictObject({
				description: z
					.string()
					.default("")
					.transform((value) => value.trim()),
				dueAt: z
					.string()
					.optional()
					.default("")
					.transform((value) => value.trim()),
				priority: z.enum(["low", "medium", "high"]).default("medium"),
				projectId: z.preprocess(
					(value) => (value === "" ? undefined : value),
					z.coerce.number().int().positive().optional(),
				),
				statusCode: z.enum(["open", "completed"]).default("open"),
				title: z
					.string()
					.default("")
					.transform((value) => value.trim()),
			}),
		);

		if (!parsed.success || parsed.data.title.length < 1) {
			ctx.unprocessableEntity();
			return ctx.render("create", {
				errors: { title: ["Required"] },
				fields: parsed.success
					? {
							description: parsed.data.description,
							dueAt: parsed.data.dueAt,
							priority: parsed.data.priority,
							projectId: parsed.data.projectId ?? "",
							statusCode: parsed.data.statusCode,
							title: parsed.data.title,
							version: 0,
						}
					: emptyFields,
			});
		}

		const dueAt = normalizeDueAt(parsed.data.dueAt);
		if (dueAt === undefined) {
			ctx.unprocessableEntity();
			return ctx.render("create", {
				errors: { dueAt: ["Invalid date"] },
				fields: {
					description: parsed.data.description,
					dueAt: parsed.data.dueAt,
					priority: parsed.data.priority,
					projectId: parsed.data.projectId ?? "",
					statusCode: parsed.data.statusCode,
					title: parsed.data.title,
					version: 0,
				},
			});
		}

		const todo = await this.#todoService.create({
			description: parsed.data.description,
			dueAt,
			priority: parsed.data.priority,
			projectId: parsed.data.projectId ?? null,
			statusCode: parsed.data.statusCode,
			title: parsed.data.title,
		});

		if (!todo) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${todo.id}`);
	}

	async edit(ctx: HttpContext) {
		const todoId = this.#parseTodoId(ctx);
		if (!todoId) {
			return ctx.notFound();
		}

		const todo = await this.#todoService.findById(todoId);
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
				projectId: todo.projectId ?? "",
				statusCode: todo.statusCode,
				title: todo.title,
				version: todo.version,
			},
			pageTitle: `Edit Todo #${todo.id}`,
			submitLabel: "Update",
			todoId: todo.id,
		});
	}

	async update(ctx: HttpContext) {
		const todoId = this.#parseTodoId(ctx);
		if (!todoId) {
			return ctx.notFound();
		}

		const parsed = ctx.body((z) =>
			z.strictObject({
				description: z
					.string()
					.default("")
					.transform((value) => value.trim()),
				dueAt: z
					.string()
					.optional()
					.default("")
					.transform((value) => value.trim()),
				priority: z.enum(["low", "medium", "high"]).default("medium"),
				projectId: z.preprocess(
					(value) => (value === "" ? undefined : value),
					z.coerce.number().int().positive().optional(),
				),
				statusCode: z.enum(["open", "completed"]).default("open"),
				title: z
					.string()
					.default("")
					.transform((value) => value.trim()),
				version: z.coerce.number().int().min(0),
			}),
		);

		if (!parsed.success || parsed.data.title.length < 1) {
			ctx.unprocessableEntity();
			return ctx.render("edit", {
				action: `/todos/${todoId}/edit`,
				errors: { title: ["Required"] },
				fields: parsed.success
					? {
							description: parsed.data.description,
							dueAt: parsed.data.dueAt,
							priority: parsed.data.priority,
							projectId: parsed.data.projectId ?? "",
							statusCode: parsed.data.statusCode,
							title: parsed.data.title,
							version: parsed.data.version,
						}
					: emptyFields,
				pageTitle: `Edit Todo #${todoId}`,
				submitLabel: "Update",
				todoId,
			});
		}

		const dueAt = normalizeDueAt(parsed.data.dueAt);
		if (dueAt === undefined) {
			ctx.unprocessableEntity();
			return ctx.render("edit", {
				action: `/todos/${todoId}/edit`,
				errors: { dueAt: ["Invalid date"] },
				fields: {
					description: parsed.data.description,
					dueAt: parsed.data.dueAt,
					priority: parsed.data.priority,
					projectId: parsed.data.projectId ?? "",
					statusCode: parsed.data.statusCode,
					title: parsed.data.title,
					version: parsed.data.version,
				},
				pageTitle: `Edit Todo #${todoId}`,
				submitLabel: "Update",
				todoId,
			});
		}

		const todo = await this.#todoService.update(todoId, {
			description: parsed.data.description,
			dueAt,
			priority: parsed.data.priority,
			projectId: parsed.data.projectId ?? null,
			statusCode: parsed.data.statusCode,
			title: parsed.data.title,
			version: parsed.data.version,
		});

		if (!todo) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${todo.id}`);
	}

	async delete(ctx: HttpContext) {
		const todoId = this.#parseTodoId(ctx);
		if (!todoId) {
			return ctx.notFound();
		}

		const deleted = await this.#todoService.delete(todoId);
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/todos");
	}

	async toggle(ctx: HttpContext) {
		const todoId = this.#parseTodoId(ctx);
		if (!todoId) {
			return ctx.notFound();
		}

		const todo = await this.#todoService.toggle(todoId);
		if (!todo) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${todo.id}`);
	}
}
