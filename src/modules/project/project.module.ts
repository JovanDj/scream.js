import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { ProjectController } from "./project.controller.js";

export class ProjectModule implements HttpModule {
	readonly #projectController: ProjectController;

	static create(db: Database) {
		const projectController = new ProjectController(db);

		return new ProjectModule(projectController);
	}

	constructor(projectController: ProjectController) {
		this.#projectController = projectController;
	}

	mount(app: Application) {
		app.get("/projects", (ctx) => this.#projectController.index(ctx));
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
