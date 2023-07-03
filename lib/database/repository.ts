import type { Entity } from "./entity";

export interface Repository<T = Entity> {
  findById(id: Entity["id"]): Promise<T>;
  findAll(): Promise<T[]>;
  insert(entity: Partial<T>): Promise<T>;
  update(id: Entity["id"], entity: Partial<T>): Promise<number>;
  delete(id: Entity["id"]): Promise<number>;
}
