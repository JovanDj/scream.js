import type { HTTPContext } from "../../server.js";

export class TodosController {
  findAll({ res }: HTTPContext) {
    res.end("FIND ALL");
  }

  findOne({ res }: HTTPContext) {
    res.end("FIND ONE");
  }
}
