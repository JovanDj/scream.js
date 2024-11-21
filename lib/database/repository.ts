import type { Entity } from "./entity.js";

export interface Repository<T extends Entity> {
	findById(id: Entity["id"]): Promise<T | undefined>;
	findAll(): Promise<T[]>;
	insert(entity: Partial<T>): Promise<T>;
	update(id: Entity["id"], entity?: Partial<T>): Promise<T>;
	delete(id: Entity["id"]): Promise<number>;
}
