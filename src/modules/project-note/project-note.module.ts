import type { Database } from "@scream.js/database/db.js";
import { TransactionHandler } from "@scream.js/database/transaction-handler.js";
import type { Application } from "@scream.js/http/application.js";
import type { Controller } from "@scream.js/http/controller.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { ListAllProjectsService } from "../project/index.js";
import { CreateProjectNoteServiceFactory } from "./create/create-project-note.service.js";
import { ProjectNoteCreateController } from "./create/project-note-create.controller.js";
import { ProjectNoteStoreController } from "./create/project-note-store.controller.js";
import { DeleteProjectNoteService } from "./destroy/delete-project-note.service.js";
import { ProjectNoteDestroyController } from "./destroy/project-note-destroy.controller.js";
import { GetProjectNoteService } from "./get-project-note.service.js";
import { ListProjectNotesService } from "./list/list-project-notes.service.js";
import { ProjectNoteIndexController } from "./list/project-note-index.controller.js";
import { ProjectNoteShowController } from "./project-note-show.controller.js";
import { ProjectNoteEditController } from "./update/project-note-edit.controller.js";
import { ProjectNoteUpdateController } from "./update/project-note-update.controller.js";
import { UpdateProjectNoteServiceFactory } from "./update/update-project-note.service.js";

export class ProjectNoteModule implements HttpModule {
	readonly #createController: Controller;
	readonly #destroyController: Controller;
	readonly #editController: Controller;
	readonly #indexController: Controller;
	readonly #showController: Controller;
	readonly #storeController: Controller;
	readonly #updateController: Controller;

	static create(db: Database) {
		const getNote = new GetProjectNoteService(db);
		const projects = new ListAllProjectsService(db);
		const now = () => new Date().toISOString();
		return new ProjectNoteModule(
			new ProjectNoteCreateController(projects),
			new ProjectNoteDestroyController(new DeleteProjectNoteService(db)),
			new ProjectNoteEditController(getNote),
			new ProjectNoteIndexController(new ListProjectNotesService(db)),
			new ProjectNoteShowController(getNote),
			new ProjectNoteStoreController(
				new TransactionHandler(db, new CreateProjectNoteServiceFactory(now)),
				projects,
			),
			new ProjectNoteUpdateController(
				new TransactionHandler(db, new UpdateProjectNoteServiceFactory(now)),
				getNote,
			),
		);
	}

	constructor(
		createController: Controller,
		destroyController: Controller,
		editController: Controller,
		indexController: Controller,
		showController: Controller,
		storeController: Controller,
		updateController: Controller,
	) {
		this.#createController = createController;
		this.#destroyController = destroyController;
		this.#editController = editController;
		this.#indexController = indexController;
		this.#showController = showController;
		this.#storeController = storeController;
		this.#updateController = updateController;
	}

	mount(app: Application) {
		app.resource("/project-notes", {
			create: (ctx) => this.#createController.handle(ctx),
			destroy: (ctx) => this.#destroyController.handle(ctx),
			edit: (ctx) => this.#editController.handle(ctx),
			index: (ctx) => this.#indexController.handle(ctx),
			show: (ctx) => this.#showController.handle(ctx),
			store: (ctx) => this.#storeController.handle(ctx),
			update: (ctx) => this.#updateController.handle(ctx),
		});
	}
}
