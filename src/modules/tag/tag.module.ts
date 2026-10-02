import type { Database } from "@scream.js/database/db.js";
import { TransactionHandler } from "@scream.js/database/transaction-handler.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { CreateTagServiceFactory } from "./create-tag.service.js";
import { DeleteTagService } from "./delete-tag.service.js";
import { GetTagService } from "./get-tag.service.js";
import { ListAllTagsService } from "./list-all-tags.service.js";
import { ListTagsService } from "./list-tags.service.js";
import { ReplaceTodoTagsServiceFactory } from "./replace-todo-tags.service.js";
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
