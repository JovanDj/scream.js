import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { TransactionHandler } from "../transaction-handler.js";
import { CreateTodoServiceFactory } from "./create-todo.service.js";
import { DeleteTodoService } from "./delete-todo.service.js";
import { GetTodoService } from "./get-todo.service.js";
import { ListTodosService } from "./list-todos.service.js";
import { TodosCreateController } from "./todo-create.controller.js";
import { TodosDestroyController } from "./todo-destroy.controller.js";
import { TodosEditController } from "./todo-edit.controller.js";
import { TodosIndexController } from "./todo-index.controller.js";
import { TodosShowController } from "./todo-show.controller.js";
import { TodosStoreController } from "./todo-store.controller.js";
import { TodosUpdateController } from "./todo-update.controller.js";
import { UpdateTodoServiceFactory } from "./update-todo.service.js";

export class TodoModule implements HttpModule {
	readonly #createController: TodosCreateController;
	readonly #destroyController: TodosDestroyController;
	readonly #editController: TodosEditController;
	readonly #indexController: TodosIndexController;
	readonly #showController: TodosShowController;
	readonly #storeController: TodosStoreController;
	readonly #updateController: TodosUpdateController;

	static create(db: Database) {
		return new TodoModule(
			new TodosCreateController(),
			new TodosDestroyController(new DeleteTodoService(db)),
			new TodosEditController(new GetTodoService(db)),
			new TodosIndexController(new ListTodosService(db)),
			new TodosShowController(new GetTodoService(db)),
			new TodosStoreController(
				new TransactionHandler(db, new CreateTodoServiceFactory()),
			),
			new TodosUpdateController(
				new TransactionHandler(db, new UpdateTodoServiceFactory()),
			),
		);
	}

	constructor(
		createController: TodosCreateController,
		destroyController: TodosDestroyController,
		editController: TodosEditController,
		indexController: TodosIndexController,
		showController: TodosShowController,
		storeController: TodosStoreController,
		updateController: TodosUpdateController,
	) {
		this.#createController = createController;
		this.#destroyController = destroyController;
		this.#editController = editController;
		this.#indexController = indexController;
		this.#showController = showController;
		this.#storeController = storeController;
		this.#updateController = updateController;
	}

	mount(app: Application) {
		app.resource("/todos", {
			create: (ctx) => this.#createController.handle(ctx),
			destroy: (ctx) => this.#destroyController.handle(ctx),
			edit: (ctx) => this.#editController.handle(ctx),
			index: (ctx) => this.#indexController.handle(ctx),
			show: (ctx) => this.#showController.handle(ctx),
			store: (ctx) => this.#storeController.handle(ctx),
			update: (ctx) => this.#updateController.handle(ctx),
		});
	}
}
