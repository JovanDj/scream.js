import { createExpressFacade } from "./lib/http/create-express-facade.js";
import { createExpressRouter } from "./lib/router/create-express-router.js";

export const app = createExpressFacade({ port: 3000 });

const todosRouter = createExpressRouter({});

todosRouter.get("/", (req, res) => {
  const ok = "ok";
  return res.json({ ok });
});

app.useRouter("/todos", todosRouter);
