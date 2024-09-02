import { Entity } from "./entity.js";

export interface Repository<
  T extends Entity,
  K extends Partial<T> = Partial<T>,
  I = K,
> {
  findById(id: Entity["id"]): Promise<T | undefined>;
  findAll(): Promise<T[]>;
  insert(entity: K): Promise<number>;
  update(id: Entity["id"], entity: I): Promise<number>;
  delete(id: Entity["id"]): Promise<number>;
}
