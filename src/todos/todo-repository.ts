import { Repository } from "../../lib/repository";
import { Todo } from "./todo";
import { TodoMapper } from "./todo-mapper";

export class TodoRepository implements Repository<Todo> {
  constructor(private readonly mapper: TodoMapper) {}

  findAll(): Promise<Todo[]> {
    console.log("repo");
    return this.mapper.findAll();
  }

  insert(entity: Partial<Todo>): Promise<Todo> {
    return this.mapper.insert(entity);
  }
}
