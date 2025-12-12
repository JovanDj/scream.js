import type { Application } from "@scream.js/http/application.js";
import type { TodoService } from "src/core/todos/todo.service.js";
import { TodosController } from "src/http/todos/todos.controller.js";

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
	app.get("/", (ctx) =>
		ctx.render("index", {
			message: "Rendered with nunjucks",
			name: "Jovan",
		}),
	);

	app.get("/about", (ctx) => ctx.render("about"));

	app.resource("/todos", todosController);
};
