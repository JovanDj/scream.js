import type { Application } from "@scream.js/http/application.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";

type ProjectRoutes = Resource & {
	archive(ctx: Readonly<HttpContext>): Promise<void>;
	unarchive(ctx: Readonly<HttpContext>): Promise<void>;
};

type TodoRoutes = Resource & {
	completed(ctx: Readonly<HttpContext>): Promise<void>;
	dueToday(ctx: Readonly<HttpContext>): Promise<void>;
	open(ctx: Readonly<HttpContext>): Promise<void>;
	overdue(ctx: Readonly<HttpContext>): Promise<void>;
	toggle(ctx: Readonly<HttpContext>): Promise<void>;
};

type TagRoutes = {
	assignToTodo(ctx: Readonly<HttpContext>): Promise<void>;
	delete(ctx: Readonly<HttpContext>): Promise<void>;
	index(ctx: Readonly<HttpContext>): Promise<void>;
	store(ctx: Readonly<HttpContext>): Promise<void>;
};

export const createHttpApp = ({
	app,
	projectController,
	tagController,
	todosController,
}: {
	app: Application;
	projectController?: ProjectRoutes;
	tagController?: TagRoutes;
	todosController: TodoRoutes;
}) => {
	app.get("/", (ctx) =>
		ctx.render("home", {
			pageTitle: "ScreamJS Todo App",
		}),
	);

	app.get("/about", (ctx) => ctx.render("about"));

	if (projectController) {
		app.resource("/projects", projectController);
		app.post("/projects/:id/archive", (ctx) => projectController.archive(ctx));
		app.post("/projects/:id/unarchive", (ctx) =>
			projectController.unarchive(ctx),
		);
	}

	app.resource("/todos", todosController);
	app.post("/todos/:id/toggle", (ctx) => todosController.toggle(ctx));
	app.get("/todos/open", (ctx) => todosController.open(ctx));
	app.get("/todos/completed", (ctx) => todosController.completed(ctx));
	app.get("/todos/due-today", (ctx) => todosController.dueToday(ctx));
	app.get("/todos/overdue", (ctx) => todosController.overdue(ctx));

	if (tagController) {
		app.get("/tags", (ctx) => tagController.index(ctx));
		app.post("/tags/create", (ctx) => tagController.store(ctx));
		app.post("/tags/:id/delete", (ctx) => tagController.delete(ctx));
		app.post("/todos/:id/tags", (ctx) => tagController.assignToTodo(ctx));
	}
};
