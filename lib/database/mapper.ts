import { Entity } from "./entity.js";

export interface DataMapper<T extends Entity, K> {
  toEntity(row: K): T;

  findById(id: T["id"]): Promise<T | undefined>;
  findAll(): Promise<T[]>;
  insert(entity: Partial<T>): Promise<number>;
  update(id: T["id"], entity: Partial<T>): Promise<number>;
  delete(id: T["id"]): Promise<number>;
}
