import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { TagController } from "./tag.controller.js";
import { TagService } from "./tag.service.ts";

export class TagModule implements HttpModule {
	readonly #tagController: TagController;

	static create(db: Database) {
		const tagService = new TagService(db);
		const tagController = new TagController(tagService);

		return new TagModule(tagController);
	}

	constructor(tagController: TagController) {
		this.#tagController = tagController;
	}

	mount(app: Application) {
		app.get("/tags", (ctx) => this.#tagController.index(ctx));
		app.post("/tags/create", (ctx) => this.#tagController.store(ctx));
		app.post("/tags/:id/delete", (ctx) => this.#tagController.delete(ctx));
		app.post("/todos/:id/tags", (ctx) => this.#tagController.assignToTodo(ctx));
	}
}
