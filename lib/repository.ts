export interface Repository<T> {
  find(id: number): T;
  insert(entity: T): void;
  update(entity: T): void;
  delete(entity: T): void;
  save(): void;
}
