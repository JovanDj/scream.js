import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { TodosController } from "./todo.controller.js";
import { TodoService } from "./todo.service.ts";

export class TodoModule implements HttpModule {
	readonly #todosController: TodosController;

	static create(db: Database) {
		const todoService = new TodoService(db);
		const todosController = new TodosController(todoService);

		return new TodoModule(todosController);
	}

	constructor(todosController: TodosController) {
		this.#todosController = todosController;
	}

	mount(app: Application) {
		app.resource("/todos", this.#todosController);
		app.post("/todos/:id/toggle", (ctx) => this.#todosController.toggle(ctx));
	}
}
