import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { TagController } from "./tag.controller.js";

export class TagModule implements HttpModule {
	readonly #tagController: TagController;

	static create(db: Database) {
		const tagController = new TagController(db);

		return new TagModule(tagController);
	}

	constructor(tagController: TagController) {
		this.#tagController = tagController;
	}

	mount(app: Application) {
		app.get("/tags", (ctx) => this.#tagController.index(ctx));
		app.post("/tags", (ctx) => this.#tagController.store(ctx));
		app.delete("/tags/:id", (ctx) => this.#tagController.destroy(ctx));
		app.post("/todos/:id/tags", (ctx) => this.#tagController.assignToTodo(ctx));
	}
}
