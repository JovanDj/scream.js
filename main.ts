import { Application, Router } from "./server.js";
import { TodosController } from "./src/todos/todos.controller.js";

const router = new Router();
const app = new Application(router);
const todosController = new TodosController();

router.get("/todos", ({ req, res }) => todosController.findAll({ req, res }));
router.get("/todos/1", ({ req, res }) => todosController.findOne({ req, res }));

export const server = app
  .createServer()
  .listen(3000, () => console.log("listening on port 3000"));
