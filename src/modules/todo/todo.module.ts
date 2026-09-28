import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { TodosCreateController } from "./todo-create.controller.js";
import { TodosDestroyController } from "./todo-destroy.controller.js";
import { TodosEditController } from "./todo-edit.controller.js";
import { TodosIndexController } from "./todo-index.controller.js";
import { TodosShowController } from "./todo-show.controller.js";
import { TodosStoreController } from "./todo-store.controller.js";
import { TodosUpdateController } from "./todo-update.controller.js";

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
			new TodosDestroyController(db),
			new TodosEditController(db),
			new TodosIndexController(db),
			new TodosShowController(db),
			new TodosStoreController(db),
			new TodosUpdateController(db),
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
