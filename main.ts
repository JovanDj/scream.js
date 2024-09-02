import { Application } from "@scream.js/http/application.interface";
import { createKoaApp } from "@scream.js/http/koa/create-koa-application";
import { todoController } from "./src/todos";

export const app: Application = createKoaApp();

app
  .get("/", (ctx) =>
    ctx.json({
      name: "Jovan",
      message: "Rendered with nunjucks",
    })
  )
  .get("/about", (ctx) => ctx.render("about"));

app.resource("/todos", todoController);
