import type { Connection } from "@scream.js/database/connection.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { TodosController } from "./todo.controller.js";
import { TodoModel } from "./todo.model.js";

export class TodoModule implements HttpModule {
	readonly #todosController: TodosController;

	static create(connection: Connection) {
		const todosController = new TodosController(new TodoModel(connection));

		return new TodoModule(todosController);
	}

	constructor(todosController: TodosController) {
		this.#todosController = todosController;
	}

	mount(app: Application) {
		app.resource("/todos", this.#todosController);
	}
}
