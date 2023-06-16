import type { Server } from "./lib/http/server.interface.js";
import { createExpressFacade } from "./lib/http/create-express-facade.js";
import { ExpressServer } from "./lib/http/express-server.js";

const express = createExpressFacade();
export const app: Server = new ExpressServer(express);

app.get("/", (ctx) => {
  ctx.response.end("hello world");
});

app.get("/asdf", (ctx) => {
  ctx.response.end("hello world asdf");
});

app.get("/json", (ctx) => {
  ctx.response.json({ message: "hello world" });
});
