import { createExpressFacade } from "./lib/http/express-facade.js";
import { TodosController } from "./src/todos/todos.controller.js";

export const app = createExpressFacade({ port: 3000 });
const todosController = new TodosController();

const todosRouter = app.createRouter();

todosRouter.get("/", (req, res) => todosController.findAll({ req, res }));
todosRouter.get("/:id", (req, res) => todosController.findOne({ req, res }));
todosRouter.post("/", (req, res) => todosController.create({ req, res }));

app.useRouter("/todos", todosRouter);
