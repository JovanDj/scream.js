import type { Database } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { ProjectArchiveAction } from "./project-archive.action.js";
import { ProjectIndexAction } from "./project-index.action.js";
import { ProjectShowAction } from "./project-show.action.js";
import { ProjectStoreAction } from "./project-store.action.js";
import { ProjectUnarchiveAction } from "./project-unarchive.action.js";

export class ProjectModule implements HttpModule {
	readonly #archiveAction: ProjectArchiveAction;
	readonly #indexAction: ProjectIndexAction;
	readonly #showAction: ProjectShowAction;
	readonly #storeAction: ProjectStoreAction;
	readonly #unarchiveAction: ProjectUnarchiveAction;

	static create(db: Database) {
		return new ProjectModule(
			new ProjectArchiveAction(db),
			new ProjectIndexAction(db),
			new ProjectShowAction(db),
			new ProjectStoreAction(db),
			new ProjectUnarchiveAction(db),
		);
	}

	constructor(
		archiveAction: ProjectArchiveAction,
		indexAction: ProjectIndexAction,
		showAction: ProjectShowAction,
		storeAction: ProjectStoreAction,
		unarchiveAction: ProjectUnarchiveAction,
	) {
		this.#archiveAction = archiveAction;
		this.#indexAction = indexAction;
		this.#showAction = showAction;
		this.#storeAction = storeAction;
		this.#unarchiveAction = unarchiveAction;
	}

	mount(app: Application) {
		app.get("/projects", (ctx) => this.#indexAction.handle(ctx));
		app.post("/projects", (ctx) => this.#storeAction.handle(ctx));
		app.get("/projects/:id", (ctx) => this.#showAction.handle(ctx));
		app.post("/projects/:id/archive", (ctx) => this.#archiveAction.handle(ctx));
		app.post("/projects/:id/unarchive", (ctx) =>
			this.#unarchiveAction.handle(ctx),
		);
	}
}
