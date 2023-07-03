import type { Entity } from "./database/entity";
import type { HTTPContext } from "./http/http-context";

export interface CommandController<T = Entity> {
  create(ctx: HTTPContext): Promise<T>;
}
