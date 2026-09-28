import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { ProjectArchiveController } from "./project-archive.controller.js";
import { ProjectIndexController } from "./project-index.controller.js";
import { ProjectShowController } from "./project-show.controller.js";
import { ProjectStoreController } from "./project-store.controller.js";
import { ProjectUnarchiveController } from "./project-unarchive.controller.js";

export class ProjectModule implements HttpModule {
	readonly #archiveController: ProjectArchiveController;
	readonly #indexController: ProjectIndexController;
	readonly #showController: ProjectShowController;
	readonly #storeController: ProjectStoreController;
	readonly #unarchiveController: ProjectUnarchiveController;

	static create(db: Database) {
		return new ProjectModule(
			new ProjectArchiveController(db),
			new ProjectIndexController(db),
			new ProjectShowController(db),
			new ProjectStoreController(db),
			new ProjectUnarchiveController(db),
		);
	}

	constructor(
		archiveController: ProjectArchiveController,
		indexController: ProjectIndexController,
		showController: ProjectShowController,
		storeController: ProjectStoreController,
		unarchiveController: ProjectUnarchiveController,
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
