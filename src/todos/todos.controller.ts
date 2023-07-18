import { HTTPContext } from "../../lib/http/http-context.js";

export class TodosController {
  findAll({ response }: HTTPContext) {
    response.status(200);
    response.end("FIND ALL");
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
