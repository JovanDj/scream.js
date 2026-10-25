import type { Database } from "@scream.js/database/db.js";
import { TransactionHandler } from "@scream.js/database/transaction-handler.js";
import type { Application } from "@scream.js/http/application.js";
import type { Controller } from "@scream.js/http/controller.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { ReplaceTodoTagsServiceFactory } from "./assign/replace-todo-tags.service.js";
import { TagAssignController } from "./assign/tag-assign.controller.js";
import { CreateTagServiceFactory } from "./create/create-tag.service.js";
import { TagStoreController } from "./create/tag-store.controller.js";
import { DeleteTagService } from "./destroy/delete-tag.service.js";
import { TagDestroyController } from "./destroy/tag-destroy.controller.js";
import { GetTagService } from "./get-tag.service.js";
import { ListTagsService } from "./list/list-tags.service.js";
import { TagIndexController } from "./list/tag-index.controller.js";
import { ListAllTagsService } from "./list-all-tags.service.js";
import { TagShowController } from "./tag-show.controller.js";

export class TagModule implements HttpModule {
	readonly #assignController: Controller;
	readonly #destroyController: Controller;
	readonly #indexController: Controller;
	readonly #showController: Controller;
	readonly #storeController: Controller;

	static create(db: Database) {
		return new TagModule(
			new TagAssignController(
				new TransactionHandler(db, new ReplaceTodoTagsServiceFactory()),
			),
			new TagDestroyController(new DeleteTagService(db)),
			new TagIndexController(new ListTagsService(db)),
			new TagShowController(new GetTagService(db)),
			new TagStoreController(
				new TransactionHandler(db, new CreateTagServiceFactory()),
				new ListAllTagsService(db),
			),
		);
	}

	constructor(
		assignController: Controller,
		destroyController: Controller,
		indexController: Controller,
		showController: Controller,
		storeController: Controller,
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
