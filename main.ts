import { createApplication } from "@scream.js/http/create-application.js";
import { rootRoute } from "routes.js";
import { todoController } from "./src/todos/index.js";

export const app = createApplication();

app.addRoutes([
  {
    path: "/",
    route: rootRoute,
  },
  {
    path: "/users",
    route: (router) => router.get("/", (ctx) => ctx.text("USERS")),
  },
  { path: "/todos", route: (router) => router.resource("/", todoController) },
]);
