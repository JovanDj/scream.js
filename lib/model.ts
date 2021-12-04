export class Model<T> {
  private _repository: T[] = [];

  async create(model: T) {
    this._repository.push(model);
    return this._repository;
  }
  async read(): Promise<T[]> {
    return this._repository;
  }
}
