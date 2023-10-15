import { Repository } from "@scream.js/database/repository.js";
import { Todo } from "./todo.js";

export class TodoIdentityMap implements Repository<Todo> {
  constructor(
    private readonly repository: Repository<Todo>,
    private readonly identityMap: Map<Todo["id"], Todo>,
  ) {}

  async findById(id: Todo["id"]) {
    if (!this.identityMap.has(id)) {
      const todo = await this.repository.findById(id);

      if (!todo) {
        return;
      }

      this.identityMap.set(todo.id, todo);

      return todo;
    }

    return this.identityMap.get(id);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async insert(entity: Partial<Todo>) {
    return this.repository.insert(entity);
  }

  async update(id: Todo["id"], entity: Todo) {
    const updatedCount = await this.repository.update(id, entity);

    if (updatedCount > 0) {
      this.identityMap.delete(id);
    }

    return updatedCount;
  }

  async delete(id: Todo["id"]) {
    const deletedCount = await this.repository.delete(id);

    if (deletedCount > 0) {
      this.identityMap.delete(id);
    }

    return deletedCount;
  }
}
