import type { Application } from "@scream.js/http/application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { PagesController } from "./pages.controller.js";

export class PagesModule implements HttpModule {
	readonly #pagesController: PagesController;

	static create() {
		return new PagesModule(new PagesController());
	}

	constructor(pagesController: PagesController) {
		this.#pagesController = pagesController;
	}

	mount(app: Application) {
		app.get("/", (ctx) => this.#pagesController.index(ctx));
		app.get("/about", (ctx) => this.#pagesController.about(ctx));
	}
}
