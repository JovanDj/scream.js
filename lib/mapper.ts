export abstract class Mapper<T> {
  constructor(private readonly gateway: Gateway<T>) {}

  async findById(id: number): Promise<T> {
    const result = await this.gateway.findById(id);

    return this.columnsToModel(result, new T());
  }

  protected columnsToModel(result: T, model: T) {
    for (const [key, value] of Object.entries(result)) {
      model[key] = value;
    }
    return model;
  }
}
