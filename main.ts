import { createApplication } from "@scream.js/http/create-application.js";
import { todoController } from "./src/todos/index.js";

export const app = createApplication();

app.createRouter("/", (router) => {
  router.get("/", (ctx) => {
    ctx.render("./index", {
      name: "Jovan",
      message: "Rendered with ejs",
    });
  });
});

app.resource("/todos", todoController);
