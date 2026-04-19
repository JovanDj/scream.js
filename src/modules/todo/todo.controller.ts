import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import { type TodoScope, TodoService } from "./todo.service.js";

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
	readonly #todoService: TodoService;

	constructor(todoService: TodoService) {
		this.#todoService = todoService;
	}

	async index(ctx: HttpContext) {
		const parsedQuery = ctx.query(TodoService.listQueryValidator());

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
		const listOptions: {
			projectId?: number;
			scope: TodoScope;
			search: string;
		} = {
			scope,
			search: options.search,
		};

		if (options.projectId !== undefined) {
			listOptions.projectId = options.projectId;
		}

		const todos = await this.#todoService.index(listOptions);

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
		const todoId = ctx.param("id", TodoService.idParamValidator());

		const todo = await this.#todoService.findById(todoId);
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
		const parsed = ctx.body(TodoService.createBodyValidator());
		if (!parsed.success) {
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

		const input: {
			description: string;
			dueAt: string | null;
			priority: "low" | "medium" | "high";
			projectId?: number;
			statusCode: "open" | "completed";
			title: string;
		} = {
			description: parsed.data.description,
			dueAt: parsed.data.dueAt,
			priority: parsed.data.priority,
			statusCode: parsed.data.statusCode,
			title: parsed.data.title,
		};
		if (parsed.data.projectId !== undefined) {
			input.projectId = parsed.data.projectId;
		}

		const result = await this.#todoService.create(input);

		return ctx.redirect(`/todos/${result.id}`);
	}

	async edit(ctx: HttpContext) {
		const todoId = ctx.param("id", TodoService.idParamValidator());

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
				statusCode: todo.statusCode,
				title: todo.title,
			},
			pageTitle: `Edit Todo #${todo.id}`,
			submitLabel: "Update",
			todoId: todo.id,
		});
	}

	async update(ctx: HttpContext) {
		const todoId = ctx.param("id", TodoService.idParamValidator());

		const parsed = ctx.body(TodoService.updateBodyValidator());
		if (!parsed.success) {
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

		const input: {
			id: number;
			description: string;
			dueAt: string | null;
			priority: "low" | "medium" | "high";
			projectId?: number;
			statusCode: "open" | "completed";
			title: string;
		} = {
			description: parsed.data.description,
			dueAt: parsed.data.dueAt,
			id: todoId,
			priority: parsed.data.priority,
			statusCode: parsed.data.statusCode,
			title: parsed.data.title,
		};
		if (parsed.data.projectId !== undefined) {
			input.projectId = parsed.data.projectId;
		}

		const result = await this.#todoService.update(input);

		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${result.id}`);
	}

	async delete(ctx: HttpContext) {
		const todoId = ctx.param("id", TodoService.idParamValidator());

		const deleted = await this.#todoService.delete(todoId);
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/todos");
	}

	async toggle(ctx: HttpContext) {
		const todoId = ctx.param("id", TodoService.idParamValidator());

		const result = await this.#todoService.toggle({ id: todoId });
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${result.id}`);
	}
}
