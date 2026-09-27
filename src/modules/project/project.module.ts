import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { ProjectController } from "./project.controller.js";
import { ProjectIndexAction } from "./project-index.action.js";

export class ProjectModule implements HttpModule {
	readonly #projectController: ProjectController;
	readonly #indexAction: ProjectIndexAction;

	static create(db: Database) {
		const projectController = new ProjectController(db);

		return new ProjectModule(projectController, new ProjectIndexAction(db));
	}

	constructor(
		projectController: ProjectController,
		indexAction: ProjectIndexAction,
	) {
		this.#projectController = projectController;
		this.#indexAction = indexAction;
	}

	mount(app: Application) {
		app.get("/projects", (ctx) => this.#indexAction.handle(ctx));
		app.post("/projects", (ctx) => this.#projectController.store(ctx));
		app.get("/projects/:id", (ctx) => this.#projectController.show(ctx));
		app.post("/projects/:id/archive", (ctx) =>
			this.#projectController.archive(ctx),
		);
		app.post("/projects/:id/unarchive", (ctx) =>
			this.#projectController.unarchive(ctx),
		);
	}
}
