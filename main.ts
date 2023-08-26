import { createServer } from "./lib/http/create-server.js";
import { todoController } from "./src/todos/index.js";

export const app = createServer();

app.get("/", (ctx) => {
  ctx.render("./index", {
    name: "Jovan",
    message: "Rendered with ejs",
  });
});

app.get("/todos", async (ctx) => todoController.findAll(ctx));
app.get("/todos/:id", async (ctx) => todoController.findOne(ctx));
app.post("/todos", async (ctx) => todoController.create(ctx));

app.patch("/todos/:id", (ctx) => {
  ctx.response.status(200);
  ctx.response.end("UPDATE");
});
