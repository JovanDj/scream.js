import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { TagAssignController } from "./tag-assign.controller.js";
import { TagDestroyController } from "./tag-destroy.controller.js";
import { TagIndexController } from "./tag-index.controller.js";
import { TagShowController } from "./tag-show.controller.js";
import { TagStoreController } from "./tag-store.controller.js";

export class TagModule implements HttpModule {
	readonly #assignController: TagAssignController;
	readonly #destroyController: TagDestroyController;
	readonly #indexController: TagIndexController;
	readonly #showController: TagShowController;
	readonly #storeController: TagStoreController;

	static create(db: Database) {
		return new TagModule(
			new TagAssignController(db),
			new TagDestroyController(db),
			new TagIndexController(db),
			new TagShowController(db),
			new TagStoreController(db),
		);
	}

	constructor(
		assignController: TagAssignController,
		destroyController: TagDestroyController,
		indexController: TagIndexController,
		showController: TagShowController,
		storeController: TagStoreController,
	) {
		this.#assignController = assignController;
		this.#destroyController = destroyController;
		this.#indexController = indexController;
		this.#showController = showController;
		this.#storeController = storeController;
	}

	mount(app: Application) {
		app.get("/tags", (ctx) => this.#indexController.handle(ctx));
		app.get("/tags/:id", (ctx) => this.#showController.handle(ctx));
		app.post("/tags", (ctx) => this.#storeController.handle(ctx));
		app.delete("/tags/:id", (ctx) => this.#destroyController.handle(ctx));
		app.post("/todos/:id/tags", (ctx) => this.#assignController.handle(ctx));
	}
}
