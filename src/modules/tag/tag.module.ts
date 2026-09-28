import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { TagAssignAction } from "./tag-assign.action.js";
import { TagDestroyAction } from "./tag-destroy.action.js";
import { TagIndexAction } from "./tag-index.action.js";
import { TagShowAction } from "./tag-show.action.js";
import { TagStoreAction } from "./tag-store.action.js";

export class TagModule implements HttpModule {
	readonly #assignAction: TagAssignAction;
	readonly #destroyAction: TagDestroyAction;
	readonly #indexAction: TagIndexAction;
	readonly #showAction: TagShowAction;
	readonly #storeAction: TagStoreAction;

	static create(db: Database) {
		return new TagModule(
			new TagAssignAction(db),
			new TagDestroyAction(db),
			new TagIndexAction(db),
			new TagShowAction(db),
			new TagStoreAction(db),
		);
	}

	constructor(
		assignAction: TagAssignAction,
		destroyAction: TagDestroyAction,
		indexAction: TagIndexAction,
		showAction: TagShowAction,
		storeAction: TagStoreAction,
	) {
		this.#assignAction = assignAction;
		this.#destroyAction = destroyAction;
		this.#indexAction = indexAction;
		this.#showAction = showAction;
		this.#storeAction = storeAction;
	}

	mount(app: Application) {
		app.get("/tags", (ctx) => this.#indexAction.handle(ctx));
		app.get("/tags/:id", (ctx) => this.#showAction.handle(ctx));
		app.post("/tags", (ctx) => this.#storeAction.handle(ctx));
		app.delete("/tags/:id", (ctx) => this.#destroyAction.handle(ctx));
		app.post("/todos/:id/tags", (ctx) => this.#assignAction.handle(ctx));
	}
}
