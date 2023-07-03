import type { Entity } from "./database/entity";
import type { HTTPContext } from "./http/http-context";

export interface CreateController<T = Entity> {
  create(ctx: HTTPContext): Promise<T>;
}
