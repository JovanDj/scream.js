import { Resource } from "@scream.js/resource";
import { HttpContext } from "./http-context";

export class ResourceProxy implements Resource {
  readonly #resource: Resource;

  constructor(resource: Resource) {
    this.#resource = resource;
  }

  index(ctx: HttpContext) {
    console.info("PROXY RESOURCE", "INDEX");

    return this.#resource.index(ctx);
  }

  show(ctx: HttpContext): Promise<void> {
    console.info("PROXY RESOURCE", "show");

    return this.#resource.show(ctx);
  }

  create(ctx: HttpContext) {
    console.info("PROXY RESOURCE", "CREATE");

    return this.#resource.create(ctx);
  }

  store(ctx: HttpContext) {
    console.info("PROXY RESOURCE", "STORE");

    return this.#resource.store(ctx);
  }

  edit(ctx: HttpContext) {
    console.info("PROXY RESOURCE", "EDIT");

    return this.#resource.edit(ctx);
  }

  update(ctx: HttpContext) {
    console.info("PROXY RESOURCE", "UPDATE");

    return this.#resource.update(ctx);
  }

  delete(ctx: HttpContext) {
    console.info("PROXY RESOURCE", "DELETE");

    return this.#resource.delete(ctx);
  }
}
