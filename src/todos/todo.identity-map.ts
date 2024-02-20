import { Repository } from "@scream.js/database/repository.js";
import { Todo } from "./todo.js";

export class TodoIdentityMap implements Repository<Todo> {
  constructor(
    private readonly _repository: Repository<Todo>,
    private readonly _identityMap: Map<Todo["id"], Todo>
  ) {}

  async findById(id: Todo["id"]) {
    if (!this._identityMap.has(id)) {
      console.log("cache miss");
      const todo = await this._repository.findById(id);

      if (!todo) {
        return;
      }

      this._identityMap.set(todo.id, todo);

      return todo;
    }
    console.log("cache hit");

    return this._identityMap.get(id);
  }

  async findAll() {
    return this._repository.findAll();
  }

  async insert(entity: Partial<Todo>) {
    return this._repository.insert(entity);
  }

  async update(id: Todo["id"], entity: Todo) {
    const updatedCount = await this._repository.update(id, entity);

    if (updatedCount > 0) {
      this._identityMap.delete(id);
    }

    return updatedCount;
  }

  async delete(id: Todo["id"]) {
    const deletedCount = await this._repository.delete(id);

    if (deletedCount > 0) {
      this._identityMap.delete(id);
    }

    return deletedCount;
  }
}
