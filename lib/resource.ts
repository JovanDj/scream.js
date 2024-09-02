import { HttpContext } from "./http/http-context.js";

export interface Index {
  index(ctx: Readonly<HttpContext>): Promise<void>;
}

export interface Show {
  show(ctx: Readonly<HttpContext>): Promise<void>;
}

export interface Create {
  create(ctx: Readonly<HttpContext>): Promise<void>;
}

export interface Store {
  store(ctx: HttpContext): Promise<void>;
}

export interface Edit {
  edit(ctx: HttpContext): Promise<void>;
}

export interface Update {
  update(ctx: HttpContext): Promise<void>;
}

export interface Delete {
  delete(ctx: HttpContext): Promise<void>;
}

export interface Resource
  extends Index,
    Show,
    Create,
    Store,
    Edit,
    Update,
    Delete {}
