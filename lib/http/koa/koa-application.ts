import Router from "@koa/router";
import views from "@ladjs/koa-views";
import { Resource } from "@scream.js/resource.js";
import Koa from "koa";
import path from "node:path";
import nunjucks from "nunjucks";
import { Handler } from "../handler.js";
import { Middleware } from "../middleware.js";
import { KoaHttpContext } from "./koa-http-context.js";

const viewsPath = path.join(process.cwd(), "views");
const nunjucksEnv = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(viewsPath, {
    noCache: true,
    watch: true,
  }),
);

export class KoaApp {
  readonly #koa: Koa;
  readonly #router: Router;

  constructor(koa: Koa, router: Router) {
    this.#koa = koa;
    this.#router = router;

    this.#koa.use(
      views(path.join(process.cwd(), "views"), {
        map: { njk: "nunjucks" },
        extension: "njk",
        options: {
          nunjucksEnv,
        },
      }),
    );
  }

  get(path: string, handler: Handler) {
    this.#router.get(path, async (ctx) => handler(new KoaHttpContext(ctx)));
    return this;
  }

  post(path: string, handler: Handler) {
    this.#router.post(path, async (ctx) => handler(new KoaHttpContext(ctx)));
    return this;
  }

  patch(path: string, handler: Handler) {
    this.#router.patch(path, async (ctx) => handler(new KoaHttpContext(ctx)));
    return this;
  }

  delete(path: string, handler: Handler) {
    this.#router.delete(path, async (ctx) => handler(new KoaHttpContext(ctx)));
    return this;
  }

  resource(path: string, resource: Resource) {
    const proxy = new ResourceProxy(resource);
    const router = new Router({ prefix: path });

    router.get("/", async (ctx) => {
      const context = new KoaHttpContext(ctx);
      await proxy.index(context);
    });

    router.get("/create", async (ctx) => {
      const context = new KoaHttpContext(ctx);
      await proxy.create(context);
    });

    router.get("/:id/edit", async (ctx) => {
      const context = new KoaHttpContext(ctx);
      await proxy.edit(context);
    });

    router.get("/:id", async (ctx) => {
      const context = new KoaHttpContext(ctx);
      await proxy.show(context);
    });

    router.post("/", async (ctx) => {
      const context = new KoaHttpContext(ctx);
      await proxy.store(context);
    });

    router.patch(`/:id`, async (ctx) => {
      const context = new KoaHttpContext(ctx);
      await proxy.update(context);
    });

    router.delete(`/:id`, async (ctx) => {
      const context = new KoaHttpContext(ctx);
      await proxy.delete(context);
    });

    this.#koa.use(router.routes());
    this.#koa.use(router.allowedMethods());

    return this;
  }

  listen(port: number, cb?: () => void) {
    this.#koa.use(this.#router.routes());
    this.#koa.use(this.#router.allowedMethods());

    this.#koa.listen(port, cb);
    return this;
  }

  use(middleware: Middleware) {
    this.#koa.use(async (ctx, next) => {
      const context = new KoaHttpContext(ctx);
      await middleware(context);
      await next();
    });
    return this;
  }
}

class ResourceProxy<Body extends object = object> implements Resource {
  readonly #resource: Resource;

  constructor(resource: Resource) {
    this.#resource = resource;
  }

  async index(ctx: KoaHttpContext<Body>) {
    console.log("PROXY RESOURCE", "INDEX");
    await this.#resource.index(ctx);
  }

  async show(ctx: KoaHttpContext<Body>): Promise<void> {
    console.log("PROXY RESOURCE", "SHOW");
    await this.#resource.show(ctx);
  }

  async create(ctx: KoaHttpContext<Body>) {
    console.log("PROXY RESOURCE", "CREATE");
    await this.#resource.create(ctx);
  }

  async store(ctx: KoaHttpContext<Body>) {
    console.log("PROXY RESOURCE", "STORE");
    await this.#resource.store(ctx);
  }

  async edit(ctx: KoaHttpContext<Body>) {
    console.log("PROXY RESOURCE", "EDIT");
    await this.#resource.edit(ctx);
  }

  async update(ctx: KoaHttpContext<Body>) {
    console.log("PROXY RESOURCE", "UPDATE");
    await this.#resource.update(ctx);
  }

  async delete(ctx: KoaHttpContext<Body>) {
    console.log("PROXY RESOURCE", "DELETE");
    await this.#resource.delete(ctx);
  }
}
