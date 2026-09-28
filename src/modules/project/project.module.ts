import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { ProjectController } from "./project.controller.js";
import { ProjectIndexAction } from "./project-index.action.js";
import { ProjectShowAction } from "./project-show.action.js";
import { ProjectStoreAction } from "./project-store.action.js";

export class ProjectModule implements HttpModule {
	readonly #projectController: ProjectController;
	readonly #indexAction: ProjectIndexAction;
	readonly #showAction: ProjectShowAction;
	readonly #storeAction: ProjectStoreAction;

	static create(db: Database) {
		const projectController = new ProjectController(db);

		return new ProjectModule(
			projectController,
			new ProjectIndexAction(db),
			new ProjectShowAction(db),
			new ProjectStoreAction(db),
		);
	}

	constructor(
		projectController: ProjectController,
		indexAction: ProjectIndexAction,
		showAction: ProjectShowAction,
		storeAction: ProjectStoreAction,
	) {
		this.#projectController = projectController;
		this.#indexAction = indexAction;
		this.#showAction = showAction;
		this.#storeAction = storeAction;
	}

	mount(app: Application) {
		app.get("/projects", (ctx) => this.#indexAction.handle(ctx));
		app.post("/projects", (ctx) => this.#storeAction.handle(ctx));
		app.get("/projects/:id", (ctx) => this.#showAction.handle(ctx));
		app.post("/projects/:id/archive", (ctx) =>
			this.#projectController.archive(ctx),
		);
		app.post("/projects/:id/unarchive", (ctx) =>
			this.#projectController.unarchive(ctx),
		);
	}
}
