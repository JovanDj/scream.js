import { createExpressFacade } from "./lib/http/express-facade.js";
import { TodosController } from "./src/todos/todos.controller.js";

export const app = createExpressFacade({ port: 3000 });
const todosController = new TodosController();

const todosRouter = app.createRouter({});

todosRouter.get("/", todosController.findAll);
todosRouter.get("/:id", todosController.findOne);
todosRouter.post("/", todosController.create);

app.useRouter("/todos", todosRouter);
