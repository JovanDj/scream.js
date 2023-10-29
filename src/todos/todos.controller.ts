import { Repository } from "@scream.js/database/repository.js";
import { HttpContext } from "@scream.js/http/http-context.js";
import { Todo } from "./todo.js";

export class TodosController {
  constructor(private readonly _todoRepository: Repository<Todo>) {}

  async findAll(ctx: HttpContext) {
    const todos = await this._todoRepository.findAll();

    ctx.json({ todos });
  }

  async findOne(ctx: HttpContext) {
    const todo = await this._todoRepository.findById(ctx.id);
    if (!todo) {
      ctx.notFound(); return;
    }

    ctx.json({ todo });
  }

  async create(ctx: HttpContext) {
    const result = await this._todoRepository.insert(new Todo());

    ctx.redirect("http://localhost:3000/todos/" + result.lastId);
  }
}
