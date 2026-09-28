import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { TodosController } from "./todo.controller.js";
import { TodosIndexAction } from "./todo-index.action.js";
import { TodosShowAction } from "./todo-show.action.js";
import { TodosStoreAction } from "./todo-store.action.js";

export class TodoModule implements HttpModule {
	readonly #todosController: TodosController;
	readonly #indexAction: TodosIndexAction;
	readonly #showAction: TodosShowAction;
	readonly #storeAction: TodosStoreAction;

	static create(db: Database) {
		const todosController = new TodosController(db);

		return new TodoModule(
			todosController,
			new TodosIndexAction(db),
			new TodosShowAction(db),
			new TodosStoreAction(db),
		);
	}

	constructor(
		todosController: TodosController,
		indexAction: TodosIndexAction,
		showAction: TodosShowAction,
		storeAction: TodosStoreAction,
	) {
		this.#todosController = todosController;
		this.#indexAction = indexAction;
		this.#showAction = showAction;
		this.#storeAction = storeAction;
	}

	mount(app: Application) {
		app.resource("/todos", {
			create: (ctx) => this.#todosController.create(ctx),
			destroy: (ctx) => this.#todosController.destroy(ctx),
			edit: (ctx) => this.#todosController.edit(ctx),
			index: (ctx) => this.#indexAction.handle(ctx),
			show: (ctx) => this.#showAction.handle(ctx),
			store: (ctx) => this.#storeAction.handle(ctx),
			update: (ctx) => this.#todosController.update(ctx),
		});
	}
}
