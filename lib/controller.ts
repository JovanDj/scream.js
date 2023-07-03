import type { CommandController } from "./command.controller";
import type { Entity } from "./database/entity";
import type { QueryController } from "./query.controller";

export interface Controller<T = Entity>
  extends QueryController<T>,
    CommandController<T> {}
