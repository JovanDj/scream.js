import { DataMapper } from "@scream.js/database/mapper.js";
import { Repository } from "@scream.js/database/repository.js";
import { Todo } from "./todo.js";
import { TodoRow } from "./todo.row.js";

export class TodoRepository implements Repository<Todo> {
  constructor(private readonly _mapper: DataMapper<Todo, TodoRow>) {}

  async findById(id: Todo["id"]) {
    return this._mapper.findById(id);
  }

  async findAll() {
    return this._mapper.findAll();
  }

  async insert(entity: Partial<Todo>) {
    return this._mapper.insert(entity);
  }

  async update(id: Todo["id"], entity: Partial<Todo>) {
    return this._mapper.update(id, entity);
  }

  async delete(id: Todo["id"]) {
    return this._mapper.delete(id);
  }
}
