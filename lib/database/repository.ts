import { Entity } from "./entity.js";

export interface Repository<T extends Entity = Entity> {
  findById(id: Entity["id"]): Promise<T | undefined>;
  findAll(): Promise<T[]>;
  insert(entity: Partial<T>): Promise<number>;
  update(id: Entity["id"], entity: Partial<T>): Promise<number>;
  delete(id: Entity["id"]): Promise<number>;
}
