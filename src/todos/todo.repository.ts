import type { Repository } from "../../lib/database/repository.js";
import type { Todo } from "./todo.js";

export class TodoRepository implements Repository<Todo> {
  findById(): Promise<Todo> {
    throw new Error("Method not implemented.");
  }
  findAll(): Promise<Todo[]> {
    throw new Error("Method not implemented.");
  }
  insert(): Promise<Todo> {
    throw new Error("Method not implemented.");
  }
  update(): Promise<number> {
    throw new Error("Method not implemented.");
  }
  delete(): Promise<number> {
    throw new Error("Method not implemented.");
  }
}
