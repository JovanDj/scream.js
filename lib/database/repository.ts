import { Entity } from "./entity.js";
import { InsertResult } from "./insert-result.js";

export interface Repository<T = Entity> {
  findById(id: Entity["id"]): Promise<T | undefined>;
  findAll(): Promise<T[]>;
  insert(entity: Partial<T>): Promise<InsertResult>;
  update(id: Entity["id"], entity: Partial<T>): Promise<number>;
  delete(id: Entity["id"]): Promise<number>;
}
