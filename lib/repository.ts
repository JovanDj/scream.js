export interface Repository<T> {
  // findById(id: number): Promise<T>;
  findAll(): Promise<T[]>;
  insert(entity: Partial<T>): Promise<T>;
  // update(id: number, entity: Partial<T>): Promise<number>;
  // delete(id: number): Promise<number>;
}
