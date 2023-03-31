import { createExpressFacade } from "./express-facade.js";
import { TodosController } from "./src/todos/todos.controller.js";

const app = createExpressFacade({ port: 3000 });
const todosController = new TodosController();

const todosRouter = app.createRouter();

todosRouter.get("/", (req, res) => todosController.findAll({ req, res }));
todosRouter.get("/:id", (req, res) => todosController.findOne({ req, res }));
todosRouter.post("/", (req, res) => todosController.create({ req, res }));

app.useRouter("/todos", todosRouter);

export const server = app.listen(3000, () =>
  console.log("listening on port 3000")
);
