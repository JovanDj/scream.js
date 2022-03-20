import { Todo } from "./todo";
import { TodoGateway } from "./todo-gateway";

export class TodoMapper {
  private cache = new Map<Todo["id"], Todo>();

  constructor(private readonly gateway: TodoGateway) {}

  async findById(id: number): Promise<Todo> {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    const result = await this.gateway.findById(id);

    const todo = new Todo();

    todo.id = result.id;
    todo.title = result.title;

    this.cache.set(id, todo);

    return todo;
  }

  async first(): Promise<Todo> {
    const result = await this.gateway.first();

    const todo = new Todo();

    todo.id = result.id;
    todo.title = result.title;

    return todo;
  }

  async last(): Promise<Todo> {
    const result = await this.gateway.last();

    const todo = new Todo();

    todo.id = result.id;
    todo.title = result.title;

    return todo;
  }

  async findAll(): Promise<Todo[]> {
    const results = await this.gateway.findAll();

    return results.map(result => {
      const todo = new Todo();

      todo.id = result.id;
      todo.title = result.title;
      return todo;
    });
  }

  async insert(todo: Partial<Todo>): Promise<Todo> {
    return this.findById(await this.gateway.insert(todo));
  }

  async update(id: Todo["id"], todo: Partial<Todo>): Promise<number> {
    return this.gateway.update(id, todo);
  }

  async delete(id: Todo["id"]): Promise<number> {
    return this.gateway.delete(id);
  }
}
