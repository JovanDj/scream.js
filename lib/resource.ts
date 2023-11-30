import { HttpContext } from "./http/http-context.js";

export interface Resource {
  findAll(ctx: HttpContext): Promise<void>;
  findOne(ctx: HttpContext): Promise<void>;
  create(ctx: HttpContext): Promise<void>;
  update(ctx: HttpContext): Promise<void>;
  delete(ctx: HttpContext): Promise<void>;
}
