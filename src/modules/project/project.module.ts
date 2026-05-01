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
		app.resource("/projects", this.#projectController);
		app.post("/projects/:id/archive", (ctx) =>
			this.#projectController.archive(ctx),
		);
		app.post("/projects/:id/unarchive", (ctx) =>
			this.#projectController.unarchive(ctx),
		);
	}
}
