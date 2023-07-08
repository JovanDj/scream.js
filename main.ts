import { createServer } from "./lib/http/create-server.js";
export const app = createServer();

app.get("/", (ctx) => {
  ctx.response.render("./index", {
    name: "Jovan",
    message: "Rendered with ejs",
  });
});

app.get("/todos", (ctx) => {
  ctx.response.status(200);
  ctx.response.end("FIND ALL");
});

app.get("/todos/:id", (ctx) => {
  ctx.response.status(200);
  ctx.response.end("FIND ONE");
});

app.post("/todos", (ctx) => {
  ctx.response.status(200);
  ctx.response.end("CREATE");
});

app.patch("/todos/:id", (ctx) => {
  ctx.response.status(200);
  ctx.response.end("UPDATE");
});
