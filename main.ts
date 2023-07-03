import type { Server } from "./lib/http/server.interface.js";
import { createKoaServer } from "./lib/http/create-koa-server.js";

export const app: Server = createKoaServer();

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
