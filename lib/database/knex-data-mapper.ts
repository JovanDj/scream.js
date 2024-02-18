import { Knex } from "knex";
import { Entity } from "./entity.js";
import { DataMapper } from "./mapper.js";

export abstract class KnexDataMapper<T extends Entity, K extends object>
  implements DataMapper<T, K>
{
  protected abstract tableName: string;
  protected abstract primaryKey: string;

  constructor(protected readonly _db: Knex) {}

  async findById(id: T["id"]) {
    const row = (await this._db(this.tableName)
      .where(this.primaryKey, id)
      .first()) as K | undefined;

    if (!row) {
      return undefined;
    }

    return this.toEntity(row);
  }

  async findAll() {
    const rows = (await this._db<K[]>(this.tableName).select<K[]>()) as K[];

    return this._toEntities(rows);
  }

  async insert(entity: T) {
    const result = await this._db
      .insert(this.toRow(entity))
      .into<K>(this.tableName);

    return result[0] ?? 0;
  }

  async update(id: T["id"], entity: Partial<T>) {
    return this._db(this.tableName)
      .where(this.primaryKey, id)
      .update(this.toRow(entity));
  }

  async delete(id: T["id"]) {
    return this._db(this.tableName).where(this.primaryKey, id).delete();
  }

  private _toEntities(entities: K[]) {
    return entities.map((entity) => this.toEntity(entity));
  }

  abstract toEntity(row: K): T;
  abstract toRow(entity: Partial<T>): Partial<K>;
}
