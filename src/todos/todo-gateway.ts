import { Database } from "sqlite";
import { Todo } from "./todo";

export class TodoGateway {
  private readonly _table = "todos";

  constructor(private readonly db: Database) {}

  async findById(id: number): Promise<Partial<Todo>> {
    const query = `SELECT * FROM ${this._table} WHERE id = $id`;
    const preparedStatement = await this.db.prepare(query);

    await preparedStatement.bind({ $id: id });
    const result = await preparedStatement.get<Partial<Todo>>();
    await preparedStatement.finalize();

    return result;
  }

  async first(): Promise<Todo> {
    const query = `SELECT * FROM ${this._table} ORDER BY ROWID ASC LIMIT 1`;
    const preparedStatement = await this.db.prepare(query);

    const result = await preparedStatement.get<Todo>();

    await preparedStatement.finalize();

    return result;
  }

  async last(): Promise<Todo> {
    const query = `SELECT * FROM ${this._table} ORDER BY ROWID DESC LIMIT 1;`;
    const preparedStatement = await this.db.prepare(query);

    const result = await preparedStatement.get<Todo>();

    await preparedStatement.finalize();

    return result;
  }

  async findAll(): Promise<Todo[]> {
    const query = `SELECT * FROM ${this._table}`;
    const preparedStatement = await this.db.prepare(query);
    const result = await preparedStatement.all<Todo[]>();
    await preparedStatement.finalize();

    return result;
  }

  async insert({ title }: { title: Todo["title"] }): Promise<Todo["id"]> {
    const query = `INSERT INTO ${this._table} (title) VALUES($title)`;
    const preparedStatement = await this.db.prepare(query);
    await preparedStatement.bind({ $title: title });

    const { lastID = 0 } = await preparedStatement.run();
    await preparedStatement.finalize();

    return lastID;
  }

  async update(id: Todo["id"], todo: Partial<Todo>): Promise<number> {
    let set: string[] = [];

    for (const key of Object.keys(todo)) {
      set = [...set, `${key} = ?`];
    }

    const query = `UPDATE ${this._table} SET ${set.join(", ")} WHERE id = ?`;
    const preparedStatement = await this.db.prepare(query);
    await preparedStatement.bind([...Object.values(todo), id]);

    const { changes = 0 } = await preparedStatement.run();
    await preparedStatement.finalize();

    return changes;
  }

  async delete(id: Todo["id"]): Promise<number> {
    const query = `DELETE FROM ${this._table} WHERE id = $id`;
    const preparedStatement = await this.db.prepare(query);
    await preparedStatement.bind({ $id: id });

    const { changes = 0 } = await preparedStatement.run();
    await preparedStatement.finalize();

    return changes;
  }
}
