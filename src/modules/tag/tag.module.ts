import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { TagController } from "./tag.controller.js";
import { TagIndexAction } from "./tag-index.action.js";
import { TagShowAction } from "./tag-show.action.js";

export class TagModule implements HttpModule {
	readonly #tagController: TagController;
	readonly #indexAction: TagIndexAction;
	readonly #showAction: TagShowAction;

	static create(db: Database) {
		const indexAction = new TagIndexAction(db);
		const tagController = new TagController(db, indexAction);

		return new TagModule(tagController, indexAction, new TagShowAction(db));
	}

	constructor(
		tagController: TagController,
		indexAction: TagIndexAction,
		showAction: TagShowAction,
	) {
		this.#tagController = tagController;
		this.#indexAction = indexAction;
		this.#showAction = showAction;
	}

	mount(app: Application) {
		app.get("/tags", (ctx) => this.#indexAction.handle(ctx));
		app.get("/tags/:id", (ctx) => this.#showAction.handle(ctx));
		app.post("/tags", (ctx) => this.#tagController.store(ctx));
		app.delete("/tags/:id", (ctx) => this.#tagController.destroy(ctx));
		app.post("/todos/:id/tags", (ctx) => this.#tagController.assignToTodo(ctx));
	}
}
