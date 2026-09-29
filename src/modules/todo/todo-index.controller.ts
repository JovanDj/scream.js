import { IndexController } from "../index.controller.js";
import type { TodoIndexData, TodoIndexInput } from "./todo.schema.js";
import { todoIndexInputSchema } from "./todo.schema.js";

export class TodosIndexController extends IndexController<
	TodoIndexInput,
	TodoIndexData
> {
	protected inputSchema() {
		return todoIndexInputSchema;
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
