import type { Application } from "@scream.js/http/application.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { TodoService } from "@todo/core/todos/todo.service.js";
import { TodosController } from "@todo/http/todos/todos.controller.js";

export const createHttpControllers = ({
	todoService,
}: {
	todoService: TodoService;
}) => {
	const todosController = new TodosController(todoService);

	return { todosController };
};

export const createHttpApp = ({
	app,
	todosController,
}: {
	app: Application;
	todosController: TodosController;
}) => {
	app.get("/", (ctx: HttpContext) =>
		ctx.render("index", {
			message: "Rendered with nunjucks",
			name: "Jovan",
		}),
	);

	app.get("/about", (ctx: HttpContext) => ctx.render("about"));

	app.resource("/todos", todosController);
};
