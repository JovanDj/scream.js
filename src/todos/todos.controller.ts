import type { Database } from "sqlite";
import { HTTPContext } from "../../lib/http/http-context";
import { Todo } from "./todo";

export class TodosController {
  constructor(private readonly db: Database) {}

  async findAll() {
    return this.db.all<Todo[]>("SELECT * FROM todos");
  }

  findOne({ response }: HTTPContext) {
    response.status(200);
    response.end("FIND ONE");
  }

  create({ response }: HTTPContext) {
    response.status(201);
    response.end("CREATE");
  }
}
