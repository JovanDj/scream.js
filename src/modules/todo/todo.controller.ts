import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import type { TodoScope } from "./todo.js";
import {
	todoCreateValidator,
	todoIdValidator,
	todoListQueryValidator,
	todoUpdateValidator,
} from "./todo.schema.js";
import type { TodoService } from "./todo.service.js";

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

export class TodosController implements Resource {
	readonly #todoService: TodoService;

	constructor(todoService: TodoService) {
		this.#todoService = todoService;
	}

	async index(ctx: HttpContext) {
		const parsedQuery = ctx.validateQuery(todoListQueryValidator);
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

		const todos = await this.#todoService.findAll(options);
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
		const parsedTodoId = ctx.validateParam("id", todoIdValidator);
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}

		const todoId = parsedTodoId.data;
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
		const parsed = ctx.validateBody(todoCreateValidator);
		if (!parsed.success) {
			ctx.unprocessableEntity();
			return ctx.render("create", {
				errors: parsed.errors,
				fields: emptyFields,
			});
		}

		const todo = await this.#todoService.create({
			description: parsed.data.description,
			dueAt: parsed.data.dueAt,
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
		const parsedTodoId = ctx.validateParam("id", todoIdValidator);
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}

		const todoId = parsedTodoId.data;
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
		const parsedTodoId = ctx.validateParam("id", todoIdValidator);
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}

		const todoId = parsedTodoId.data;
		const parsed = ctx.validateBody(todoUpdateValidator);
		if (!parsed.success) {
			ctx.unprocessableEntity();
			return ctx.render("edit", {
				action: `/todos/${todoId}/edit`,
				errors: parsed.errors,
				fields: emptyFields,
				pageTitle: `Edit Todo #${todoId}`,
				submitLabel: "Update",
				todoId,
			});
		}

		const todo = await this.#todoService.update(todoId, {
			description: parsed.data.description,
			dueAt: parsed.data.dueAt,
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
		const parsedTodoId = ctx.validateParam("id", todoIdValidator);
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}

		const todoId = parsedTodoId.data;
		const deleted = await this.#todoService.delete(todoId);
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/todos");
	}

	async toggle(ctx: HttpContext) {
		const parsedTodoId = ctx.validateParam("id", todoIdValidator);
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}

		const todoId = parsedTodoId.data;
		const todo = await this.#todoService.toggle(todoId);
		if (!todo) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${todo.id}`);
	}
}
