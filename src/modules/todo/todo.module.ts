import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { TodosCreateAction } from "./todo-create.action.js";
import { TodosDestroyAction } from "./todo-destroy.action.js";
import { TodosEditAction } from "./todo-edit.action.js";
import { TodosIndexAction } from "./todo-index.action.js";
import { TodosShowAction } from "./todo-show.action.js";
import { TodosStoreAction } from "./todo-store.action.js";
import { TodosUpdateAction } from "./todo-update.action.js";

export class TodoModule implements HttpModule {
	readonly #createAction: TodosCreateAction;
	readonly #destroyAction: TodosDestroyAction;
	readonly #editAction: TodosEditAction;
	readonly #indexAction: TodosIndexAction;
	readonly #showAction: TodosShowAction;
	readonly #storeAction: TodosStoreAction;
	readonly #updateAction: TodosUpdateAction;

	static create(db: Database) {
		return new TodoModule(
			new TodosCreateAction(),
			new TodosDestroyAction(db),
			new TodosEditAction(db),
			new TodosIndexAction(db),
			new TodosShowAction(db),
			new TodosStoreAction(db),
			new TodosUpdateAction(db),
		);
	}

	constructor(
		createAction: TodosCreateAction,
		destroyAction: TodosDestroyAction,
		editAction: TodosEditAction,
		indexAction: TodosIndexAction,
		showAction: TodosShowAction,
		storeAction: TodosStoreAction,
		updateAction: TodosUpdateAction,
	) {
		this.#createAction = createAction;
		this.#destroyAction = destroyAction;
		this.#editAction = editAction;
		this.#indexAction = indexAction;
		this.#showAction = showAction;
		this.#storeAction = storeAction;
		this.#updateAction = updateAction;
	}

	mount(app: Application) {
		app.resource("/todos", {
			create: (ctx) => this.#createAction.handle(ctx),
			destroy: (ctx) => this.#destroyAction.handle(ctx),
			edit: (ctx) => this.#editAction.handle(ctx),
			index: (ctx) => this.#indexAction.handle(ctx),
			show: (ctx) => this.#showAction.handle(ctx),
			store: (ctx) => this.#storeAction.handle(ctx),
			update: (ctx) => this.#updateAction.handle(ctx),
		});
	}
}
