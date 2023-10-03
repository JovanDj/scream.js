import { Repository } from "../../lib/database/repository.js";
import { HTTPContext } from "../../lib/http/http-context.js";
import { Todo } from "./todo.js";

export class TodosController {
  constructor(private readonly todoRepository: Repository<Todo>) {}

  async findAll(ctx: HTTPContext) {
    const todos = await this.todoRepository.findAll();

    ctx.json({ todos });
  }

  async findOne(ctx: HTTPContext) {
    const todo = await this.todoRepository.findById(ctx.id);

    if (!todo) {
      return ctx.notFound();
    }

    return ctx.json({ todo });
  }

  async create(ctx: HTTPContext) {
    const result = await this.todoRepository.insert(new Todo());

    ctx.redirect("http://localhost:3000/todos/" + result.lastId);
  }
}
