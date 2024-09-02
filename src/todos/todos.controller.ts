import { Repository } from "@scream.js/database/repository.js";
import { FlatObject } from "@scream.js/flat-object.js";
import { HttpContext } from "@scream.js/http/http-context.js";
import { Resource } from "@scream.js/resource.js";
import { CreateTodoDto } from "./create-todo.dto.js";
import { Todo } from "./todo.js";

export class TodosController implements Resource {
  readonly #todoRepository: Readonly<Repository<Todo>>;

  constructor(readonly todoRepository: Readonly<Repository<Todo>>) {
    this.#todoRepository = todoRepository;
  }

  async index(ctx: Readonly<HttpContext>) {
    const todos = await this.#todoRepository.findAll();

    return ctx.render("index", { todos });
  }

  async show(ctx: HttpContext) {
    if (!ctx.params["id"]) {
      return ctx.notFound();
    }

    const todo = await this.#todoRepository.findById(+ctx.params["id"]);

    if (!todo) {
      return ctx.notFound();
    }

    const dto: FlatObject = {
      todoTitle: todo.title,
      lang: ctx.acceptsLanguages(["en-US", "sr-Latn-RS"]),
      pageTitle: `Todo | ${todo.id.toString()}`,
    };

    return ctx.render("show", dto);
  }

  create(ctx: HttpContext) {
    return ctx.render("create");
  }

  async store(ctx: HttpContext<CreateTodoDto>) {
    const errors = {
      title: { required: "" },
    };

    if (!ctx.body.title) {
      errors.title.required = "Missing";
    }

    if (ctx.hasHeader("X-UP-VALIDATE")) {
      return ctx.render("create", {
        title: ctx.body.title,
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

    const result = await this.#todoRepository.insert({ title: ctx.body.title });

    return ctx
      .status(201)
      .redirect("http://localhost:3000/todos/" + result.toString());
  }

  edit(ctx: HttpContext) {
    return ctx.render("");
  }

  async update(ctx: HttpContext<{ title: string }>) {
    if (!ctx.params["id"]) {
      return ctx.notFound();
    }

    const res = await this.#todoRepository.update(+ctx.params["id"], {});

    return ctx.redirect("http://localhost:3000/todos/" + res.toString());
  }

  async delete(ctx: HttpContext) {
    if (!ctx.params["id"]) {
      return ctx.notFound();
    }

    await this.#todoRepository.delete(+ctx.params["id"]);

    return ctx.status(200).end();
  }
}
