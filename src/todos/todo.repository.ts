import type { Repository } from "../../lib/database/repository";
import type { Todo } from "./todo";

export class TodoRepository implements Repository<Todo> {
  findById(id: string | number): Promise<Todo> {
    throw new Error("Method not implemented.");
  }
  findAll(): Promise<Todo[]> {
    throw new Error("Method not implemented.");
  }
  insert(entity: Partial<Todo>): Promise<Todo> {
    throw new Error("Method not implemented.");
  }
  update(id: string | number, entity: Partial<Todo>): Promise<number> {
    throw new Error("Method not implemented.");
  }
  delete(id: string | number): Promise<number> {
    throw new Error("Method not implemented.");
  }
}
