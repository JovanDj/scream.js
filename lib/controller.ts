import { Repository } from "./repository";

export abstract class Controller<T> {
  constructor(private readonly repository: Repository<T>) {}

  async findAll() {
    return this.repository.findAll();
  }

  create(model: T) {
    return this.repository.insert(model);
  }
}
