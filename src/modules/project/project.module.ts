import type { Database } from "@scream.js/database/db.js";
import { TransactionHandler } from "@scream.js/database/transaction-handler.js";
import type { Application } from "@scream.js/http/application.js";
import type { Controller } from "@scream.js/http/controller.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { ArchiveProjectServiceFactory } from "./archive/archive-project.service.js";
import { ProjectArchiveController } from "./archive/project-archive.controller.js";
import { CreateProjectServiceFactory } from "./create/create-project.service.js";
import { ProjectStoreController } from "./create/project-store.controller.js";
import { GetProjectService } from "./get-project.service.js";
import { ListProjectsService } from "./list/list-projects.service.js";
import { ProjectIndexController } from "./list/project-index.controller.js";
import { ProjectShowController } from "./project-show.controller.js";
import { ProjectUnarchiveController } from "./unarchive/project-unarchive.controller.js";
import { UnarchiveProjectServiceFactory } from "./unarchive/unarchive-project.service.js";

export class ProjectModule implements HttpModule {
	readonly #archiveController: Controller;
	readonly #indexController: Controller;
	readonly #showController: Controller;
	readonly #storeController: Controller;
	readonly #unarchiveController: Controller;

	static create(db: Database) {
		return new ProjectModule(
			new ProjectArchiveController(
				new TransactionHandler(db, new ArchiveProjectServiceFactory()),
			),
			new ProjectIndexController(new ListProjectsService(db)),
			new ProjectShowController(new GetProjectService(db)),
			new ProjectStoreController(
				new TransactionHandler(db, new CreateProjectServiceFactory()),
			),
			new ProjectUnarchiveController(
				new TransactionHandler(db, new UnarchiveProjectServiceFactory()),
			),
		);
	}

	constructor(
		archiveController: Controller,
		indexController: Controller,
		showController: Controller,
		storeController: Controller,
		unarchiveController: Controller,
	) {
		this.#archiveController = archiveController;
		this.#indexController = indexController;
		this.#showController = showController;
		this.#storeController = storeController;
		this.#unarchiveController = unarchiveController;
	}

	mount(app: Application) {
		app.get("/projects", (ctx) => this.#indexController.handle(ctx));
		app.post("/projects", (ctx) => this.#storeController.handle(ctx));
		app.get("/projects/:id", (ctx) => this.#showController.handle(ctx));
		app.post("/projects/:id/archive", (ctx) =>
			this.#archiveController.handle(ctx),
		);
		app.post("/projects/:id/unarchive", (ctx) =>
			this.#unarchiveController.handle(ctx),
		);
	}
}
