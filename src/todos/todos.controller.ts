import { Repository } from "../../lib/database/repository.js";
import { HTTPContext } from "../../lib/http/http-context.js";
import { Todo } from "./todo.js";

export class TodosController {
  constructor(private readonly todoRepository: Repository<Todo>) {}

  async findAll({}: HTTPContext) {
    return this.todoRepository.findAll();
  }

  async findOne({}: HTTPContext) {
    return this.todoRepository.findById(1);
  }

  async create() {
    return this.todoRepository.insert(new Todo());
  }
}
