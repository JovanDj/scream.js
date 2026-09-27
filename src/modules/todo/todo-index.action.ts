import type { Database } from "@scream.js/database/db.js";
import { IndexAction, type IndexInput } from "../index.action.js";
import type { TodoIndexData, TodoIndexInput } from "./todo.schema.js";
import { todoIndexDataSchema, todoIndexInputSchema } from "./todo.schema.js";

export class TodosIndexAction extends IndexAction<
	TodoIndexInput,
	TodoIndexData
> {
	protected inputSchema() {
		return todoIndexInputSchema;
	}

	protected async load(input: IndexInput<TodoIndexInput>, db: Database) {
		const query = db("todos")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.select(
				"todos.id",
				"todos.title",
				db.ref("todo_statuses.code").as("status_code"),
			);

		if (input.search.length > 0) {
			query.andWhereLike("todos.title", `%${input.search}%`);
		}
		if (input.status === "open") {
			query.where({ "todo_statuses.code": "open" });
		}
		if (input.status === "completed") {
			query.where({ "todo_statuses.code": "completed" });
		}
		if (input.status === "dueToday") {
			query.where({ "todo_statuses.code": "open" });
			query.whereRaw("date(todos.due_at) = date('now', 'localtime')");
		}

		query.orderBy(this.#sortColumn(input.sort), input.direction);
		if (input.sort !== "created") {
			query.orderBy("todos.id", "desc");
		}

		return query.limit(input.limit).offset(input.offset);
	}

	protected dataSchema() {
		return todoIndexDataSchema;
	}

	protected pageUrl(input: TodoIndexInput, page: number) {
		return this.#createUrl(input, { page });
	}

	protected present(todos: TodoIndexData, input: TodoIndexInput) {
		return {
			direction: input.direction,
			filters: {
				all: this.#createUrl(input, { page: 1, status: "all" }),
				completed: this.#createUrl(input, { page: 1, status: "completed" }),
				dueToday: this.#createUrl(input, { page: 1, status: "dueToday" }),
				open: this.#createUrl(input, { page: 1, status: "open" }),
			},
			pageTitle: "Todos",
			search: input.search,
			sort: input.sort,
			sorts: {
				created: this.#sortUrl(input, "created", "desc"),
				status: this.#sortUrl(input, "status", "asc"),
				title: this.#sortUrl(input, "title", "asc"),
			},
			status: input.status,
			todos,
		};
	}

	protected template() {
		return "index";
	}

	#sortColumn(sort: TodoIndexInput["sort"]) {
		switch (sort) {
			case "created":
				return "todos.id";
			case "status":
				return "todo_statuses.code";
			case "title":
				return "todos.title";
		}
	}

	#sortUrl(
		input: TodoIndexInput,
		sort: TodoIndexInput["sort"],
		defaultDirection: TodoIndexInput["direction"],
	) {
		return this.#createUrl(input, {
			direction:
				input.sort === sort && input.direction === defaultDirection
					? defaultDirection === "asc"
						? "desc"
						: "asc"
					: defaultDirection,
			page: 1,
			sort,
		});
	}

	#createUrl(
		input: TodoIndexInput,
		changes: {
			direction?: TodoIndexInput["direction"];
			page?: number;
			sort?: TodoIndexInput["sort"];
			status?: TodoIndexInput["status"];
		},
	) {
		const direction = changes.direction ?? input.direction;
		const page = changes.page ?? input.page;
		const sort = changes.sort ?? input.sort;
		const status = changes.status ?? input.status;
		const params = new URLSearchParams();
		if (status !== "all") {
			params.set("status", status);
		}
		if (input.search.length > 0) {
			params.set("search", input.search);
		}
		if (sort !== "created") {
			params.set("sort", sort);
		}
		if (direction !== "desc") {
			params.set("direction", direction);
		}
		if (page > 1) {
			params.set("page", String(page));
		}

		const query = params.toString();
		return query.length > 0 ? `/todos?${query}` : "/todos";
	}
}
