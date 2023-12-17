import { Repository } from "@scream.js/database/repository.js";
import { HttpContext } from "@scream.js/http/http-context.js";
import { Resource } from "@scream.js/resource.js";
import { Todo } from "./todo.js";

export class TodosController implements Resource {
  constructor(private readonly _todoRepository: Repository<Todo>) {}

  async findAll(ctx: HttpContext) {
    const todos = await this._todoRepository.findAll();
    console.log({ todos });
    // Todo: works, fix type
    ctx.json(todos);
  }

  async findOne(ctx: HttpContext) {
    const todo = await this._todoRepository.findById(ctx.id);
    console.log({ todo });
    if (!todo) {
      return ctx.notFound();
    }

    ctx.json(todo);
  }

  async create(ctx: HttpContext<{ title: string }>) {
    if (!ctx.body.title) {
      return ctx.status(400).json({ title: "Missing" });
    }

    const todo = new Todo();
    todo.title = ctx.body.title;

    const result = await this._todoRepository.insert(todo);

    ctx.status(201).redirect("http://localhost:3000/todos/" + result.lastId);
  }

  async update(ctx: HttpContext<{ title: string }>) {
    const todo = new Todo();
    todo.title = ctx.body.title;

    const res = await this._todoRepository.update(ctx.id, todo);
    ctx.redirect("http://localhost:3000/todos/" + res);
  }

  async delete(ctx: HttpContext) {
    await this._todoRepository.delete(+ctx.id);

    ctx.json({});
  }
}
