import { HttpContext } from "./http/http-context.js";

export interface Resource {
  index(ctx: HttpContext): Promise<void>;
  show(ctx: HttpContext): Promise<void>;
  create(ctx: HttpContext): Promise<void>;
  store(ctx: HttpContext): Promise<void>;
  edit(ctx: HttpContext): Promise<void>;
  update(ctx: HttpContext): Promise<void>;
  delete(ctx: HttpContext): Promise<void>;
}
