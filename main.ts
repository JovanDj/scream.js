import { createApplication } from "@scream.js/http/create-application.js";
import process from "node:process";
import { todoController } from "./src/todos/index.js";

process.on("unhandledrejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

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
