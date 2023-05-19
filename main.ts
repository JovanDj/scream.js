import { createKoaFacade } from "./lib/http/create-koa-facade.js";
import { createKoaRouter } from "./lib/router/create-koa-router.js";

export const app = createKoaFacade({ port: 3000 });

app.get("/", (ctx) => {
  ctx.body = "Hello";
});

const todosRouter = createKoaRouter();
todosRouter.get("/", (ctx) => (ctx.body = "FIND ALL"));
todosRouter.get("/:id", (ctx) => (ctx.body = "FIND ONE"));
todosRouter.post("/", (ctx) => (ctx.body = "CREATE"));
todosRouter.patch("/:id", (ctx) => (ctx.body = "UPDATE"));

app.useRouter("/todos", todosRouter);
