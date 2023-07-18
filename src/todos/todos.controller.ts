import { HTTPContext } from "../../lib/http/http-context";

export class TodosController {
  async findAll() {}

  findOne({ response }: HTTPContext) {
    response.status(200);
    response.end("FIND ONE");
  }

  create({ response }: HTTPContext) {
    response.status(201);
    response.end("CREATE");
  }
}
