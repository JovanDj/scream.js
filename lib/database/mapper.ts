import { Entity } from "./entity.js";

export interface Mapper<T extends Entity, K> {
  toEntity(row: K): T;
  toEntities(rows: K[]): T[];
}
