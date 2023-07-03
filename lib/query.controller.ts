import type { Entity } from "./database/entity";
import type { HTTPContext } from "./http/http-context";

export interface QueryController<T = Entity> {
  findAll(ctx: HTTPContext): Promise<T[]>;
  findOne(ctx: HTTPContext): Promise<T>;
}
