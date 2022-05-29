import { Gateway } from "../../lib/gateway";
import { Mapper } from "../../lib/mapper";
import { Todo } from "./todo";

export class TodoMapper extends Mapper<Todo> {
  constructor(private readonly gateway: Gateway<Todo>) {
    super(gateway);
  }

  async findById(id: number): Promise<Todo> {
    const result = await this.gateway.findById(id);

    return this.columnsToModel(result, new Todo());
  }

  async first(): Promise<Todo> {
    const result = await this.gateway.first();

    return this.columnsToModel(result, new Todo());
  }

  async last(): Promise<Todo> {
    const result = await this.gateway.last();

    return this.columnsToModel(result, new Todo());
  }

  async findAll(): Promise<Todo[]> {
    const results = await this.gateway.findAll();

    return results.map(result => {
      return this.columnsToModel(result, new Todo());
    });
  }

  async insert(todo: Partial<Todo>): Promise<Todo> {
    return this.findById((await this.gateway.insert(todo)).lastID);
  }

  async update(id: Todo["id"], todo: Partial<Todo>): Promise<number> {
    return this.gateway.update(id, todo);
  }

  async delete(id: Todo["id"]): Promise<number> {
    return this.gateway.delete(id);
  }
}
