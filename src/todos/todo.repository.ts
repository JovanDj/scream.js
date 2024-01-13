import { Mapper } from "@scream.js/database/mapper.js";
import type { Repository } from "@scream.js/database/repository.js";
import { Knex } from "knex";
import { Todo } from "./todo.js";
import { TodoRow } from "./todo.row.js";

export class TodoRepository implements Repository<Todo> {
  private readonly _readonlySerializable: Knex.TransactionConfig = {
    readOnly: true,
    isolationLevel: "serializable",
  };

  constructor(
    private readonly _db: Knex,
    private readonly _mapper: Mapper<Todo, TodoRow>,
  ) {}

  async findById(id: Todo["id"]) {
    const row = await this._db<TodoRow>("todos").where("todo_id", id).first();

    if (!row) {
      return undefined;
    }

    return this._mapper.toEntity(row);
  }

  async findAll() {
    const rows = await this._db.transaction(async (trx) => {
      return this._db("todos").transacting(trx).select<TodoRow[]>();
    }, this._readonlySerializable);

    return this._mapper.toEntities(rows);
  }

  async insert(todo: Todo) {
    const result = await this._db.transaction(async (trx) =>
      this._db
        .insert({
          title: todo.title,
          due_date: todo.dueDate.toISOString(),
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .transacting(trx)
        .into<TodoRow>("todos"),
    );

    return result[0] ?? 0;
  }

  async update(id: Todo["id"], todo: Partial<Todo>) {
    await this._db("todos")
      .where("todo_id", id)
      .update({ ...todo });

    return id;
  }

  async delete(id: Todo["id"]) {
    await this._db.transaction(
      async (trx) =>
        this._db<TodoRow>("todos")
          .transacting(trx)
          .where("todo_id", id)
          .delete(),
      { isolationLevel: "serializable" },
    );

    return id;
  }
}
