import { Repository } from "@scream.js/database/repository.js";
import { HttpContext } from "@scream.js/http/http-context.js";
import { Resource } from "@scream.js/resource.js";
import { Todo } from "./todo.js";

export class TodosController implements Resource {
  constructor(private readonly _todoRepository: Repository<Todo>) {}

  async index(ctx: HttpContext) {
    const todos = await this._todoRepository.findAll();

    ctx.render("index", { todos });
  }

  async show(ctx: HttpContext) {
    const todo = await this._todoRepository.findById(ctx.id);

    if (!todo) {
      return ctx.notFound();
    }

    ctx.render("show", { todo });
  }

  async create(ctx: HttpContext) {
    return new Promise<void>((resolve, reject) => {
      try {
        return resolve(ctx.render("create", {}));
      } catch (error) {
        reject(error);
      }
    });
  }

  async store(ctx: HttpContext<{ title: string; "due-date": string }>) {
    const errors = [];

    if (!ctx.body.title) {
      errors.push({ title: "Missing" });
    }

    if (!ctx.body["due-date"]) {
      errors.push({ dueDate: "Missing" });
    }

    if (isNaN(new Date(ctx.body["due-date"]).getTime())) {
      errors.push({ dueDate: "Invalid date" });
    }

    if (errors.length) {
      return ctx.status(400).json({ errors });
    }

    const todo = new Todo();
    todo.title = ctx.body.title;
    todo.dueDate = new Date(ctx.body["due-date"]);

    const result = await this._todoRepository.insert(todo);

    ctx.status(201).redirect("http://localhost:3000/todos/" + result.lastId);
  }

  async edit(ctx: HttpContext) {
    return new Promise<void>((resolve, reject) => {
      try {
        return resolve(ctx.render("", {}));
      } catch (error) {
        reject(error);
      }
    });
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
