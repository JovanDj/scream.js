import { Database } from "sqlite";

export abstract class Gateway<T> {
  abstract readonly table: string;
  constructor(private readonly db: Database) {}

  async findById(id: number): Promise<T> {
    const query = `SELECT * FROM ${this.table} WHERE id = $id`;
    const preparedStatement = await this.db.prepare(query);

    await preparedStatement.bind({ $id: id });
    const result = await preparedStatement.get<T>();
    await preparedStatement.finalize();

    if (!result) {
      throw new Error("Not found.");
    }

    return result;
  }

  async first(): Promise<T> {
    const query = `SELECT * FROM ${this.table} ORDER BY ROWID ASC LIMIT 1`;
    const preparedStatement = await this.db.prepare(query);

    const result = await preparedStatement.get<T>();

    await preparedStatement.finalize();

    if (!result) {
      throw new Error("Not found.");
    }

    return result;
  }

  async last(): Promise<T> {
    const query = `SELECT * FROM ${this.table} ORDER BY ROWID DESC LIMIT 1;`;
    const preparedStatement = await this.db.prepare(query);

    const result = await preparedStatement.get<T>();

    if (!result) {
      throw new Error("Not found.");
    } else {
      await preparedStatement.finalize();

      return result;
    }
  }

  async findAll(): Promise<T[]> {
    const query = `SELECT * FROM ${this.table}`;
    const preparedStatement = await this.db.prepare(query);
    const result = (await preparedStatement.all<T[]>()) ?? [];
    await preparedStatement.finalize();

    return result;
  }

  async insert(todo: Partial<T>): Promise<{ lastID: number; changes: number }> {
    const query = `INSERT INTO ${this.table} (title) VALUES($title)`;
    const preparedStatement = await this.db.prepare(query);
    await preparedStatement.bind({ $title: todo.title });

    const { lastID = 0, stmt, changes } = await preparedStatement.run();
    await preparedStatement.finalize();

    return { lastID, changes };
  }

  async update(id: T["id"], todo: Partial<T>): Promise<number> {
    let set: string[] = [];

    for (const key of Object.keys(todo)) {
      set = [...set, `${key} = ?`];
    }

    const query = `UPDATE ${this.table} SET ${set.join(", ")} WHERE id = ?`;
    const preparedStatement = await this.db.prepare(query);
    await preparedStatement.bind([...Object.values(todo), id]);

    const { changes = 0 } = await preparedStatement.run();
    await preparedStatement.finalize();

    return changes;
  }

  async delete(id: T["id"]): Promise<number> {
    const query = `DELETE FROM ${this.table} WHERE id = $id`;
    const preparedStatement = await this.db.prepare(query);
    await preparedStatement.bind({ $id: id });

    const { changes = 0 } = await preparedStatement.run();
    await preparedStatement.finalize();

    return changes;
  }
}
