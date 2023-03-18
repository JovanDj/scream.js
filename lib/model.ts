export class Model<T> {
  private _repository: T[] = [];

  create(model: T) {
    this._repository.push(model);
    return this._repository;
  }
  read(): Promise<T[]> {
    return this._repository;
  }
}
