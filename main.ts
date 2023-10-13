import { createServer } from "./lib/http/create-server.js";
import { todoController } from "./src/todos/index.js";

export const app = createServer();

app.createRouter("/", (router) => {
  router.get("/", (ctx) => {
    ctx.render("./index", {
      name: "Jovan",
      message: "Rendered with ejs",
    });
  });
});

app.createRouter("/todos", (router) => {
  router.get("/", async (ctx) => todoController.findAll(ctx));
  router.get("/:id", async (ctx) => todoController.findOne(ctx));
  router.post("/", async (ctx) => todoController.create(ctx));
});
