import {
  createServer,
  IncomingMessage,
  ServerResponse,
  STATUS_CODES
} from "node:http";

class TodosController {
  async findAll({ res }: HTTPContext) {
    res.end("FIND ALL");
  }

  async findOne({ res }: HTTPContext) {
    res.end("FIND ONE");
  }
}

const todosController = Reflect.construct(
  TodosController,
  []
) as TodosController;

type HTTPContext = {
  req: IncomingMessage;
  res: ServerResponse;
};

type Routes = {
  [key: string]: {
    [key: string]: ({ req, res }: HTTPContext) => void;
  };
};

const routes: Routes = {
  GET: {
    "/todos": todosController.findAll,
    "/todos/1": todosController.findOne
  }
};

const get = (path: string, handler: ({}: HTTPContext) => void) => {
  routes["GET"][path] = handler;
};

get("/", ({ res }) => res.end("ROOT"));

const server = createServer((req, res) => {
  try {
    routes[req.method][req.url]({ req, res });
  } catch (error) {
    res.writeHead(404);
    res.write(STATUS_CODES[404]);
    res.end();
  }
});

server.listen(3000, () => console.log("Listening on port 3000."));
