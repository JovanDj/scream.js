import { Repository } from "@scream.js/database/repository.js";
import { FlatObject } from "@scream.js/flat-object.js";
import { HttpContext } from "@scream.js/http/http-context.js";
import { Resource } from "@scream.js/resource.js";
import { Todo } from "./todo.js";

export class TodosController implements Resource {
  constructor(private readonly _todoRepository: Repository<Todo>) {}

  async index(ctx: HttpContext) {
    try {
      const todos = await this._todoRepository.findAll();
      ctx.render("index", { todos });
    } catch (error) {
      ctx.handleError(error);
    }
  }

  async show(ctx: HttpContext) {
    try {
      if (!ctx.id) {
        return ctx.notFound();
      }

      const todo = await this._todoRepository.findById(ctx.id);

      if (!todo) {
        return ctx.notFound();
      }

      const language = ctx.acceptsLanguages(["en-US", "sr-Latn-RS"]);

      const dto: FlatObject = {
        todoTitle: todo.title,
        createdAt: todo.createdAt.toLocaleDateString(language),
        updatedAt: todo.updatedAt.toLocaleDateString(language),
        dueDate: todo.dueDate.toLocaleDateString(language),
        lang: language,
        pageTitle: `Todo | ${todo.id}`,
      };

      ctx.render("show", dto);
    } catch (error) {
      ctx.handleError(error);
    }
  }

  async create(ctx: HttpContext) {
    return new Promise<void>((resolve, reject) => {
      try {
        return resolve(ctx.render("create", {}));
      } catch (error) {
        if (error instanceof Error) {
          reject(error);
        }
      }
    });
  }

  async store(ctx: HttpContext<{ title: string; "due-date": string }>) {
    try {
      const errors = {
        dueDate: { required: "", date: "" },
        title: { required: "" },
      };

      if (!ctx.body.title) {
        errors.title.required = "Missing";
      }

      if (!ctx.body["due-date"]) {
        errors.dueDate.required = "Missing";
      }

      if (isNaN(new Date(ctx.body["due-date"]).getTime())) {
        errors.dueDate.date = "Invalid date";
      }

      if (ctx.hasHeader("X-UP-VALIDATE")) {
        return ctx.render("create", {
          title: ctx.body.title,
          dueDate: ctx.body["due-date"],
          errors,
        });
      }

      if (
        Object.values(errors).some((field) =>
          Object.values(field).some((errorMessage) => errorMessage)
        )
      ) {
        return ctx
          .status(422)
          .render("create", { title: ctx.body.title, errors });
      }

      const todo = new Todo();
      todo.title = ctx.body.title;
      todo.dueDate = new Date(ctx.body["due-date"]);

      const result = await this._todoRepository.insert(todo);

      ctx.status(201).redirect("http://localhost:3000/todos/" + result);
    } catch (error) {
      ctx.handleError(error);
    }
  }

  async edit(ctx: HttpContext) {
    return new Promise<void>((resolve, reject) => {
      try {
        return resolve(ctx.render("", {}));
      } catch (error) {
        if (error instanceof Error) {
          reject(error);
        }
      }
    });
  }

  async update(ctx: HttpContext<{ title: string }>) {
    try {
      if (!ctx.id) {
        return ctx.notFound();
      }

      const todo = new Todo();
      todo.title = ctx.body.title;

      const res = await this._todoRepository.update(ctx.id, todo);
      ctx.redirect("http://localhost:3000/todos/" + res);
    } catch (error) {
      ctx.handleError(error);
    }
  }

  async delete(ctx: HttpContext) {
    try {
      if (!ctx.id) {
        return ctx.notFound();
      }
      await this._todoRepository.delete(ctx.id);

      ctx.json({});
    } catch (error) {
      ctx.handleError(error);
    }
  }
}
