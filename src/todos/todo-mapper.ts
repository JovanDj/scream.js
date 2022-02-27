import { Database } from "sqlite";
import { Todo } from "./todo";

export class TodoMapper {
  private readonly _table = "todos";

  constructor(private readonly db: Database) {}

  async findById(id: number): Promise<Todo> {
    const query = "SELECT * FROM todos WHERE id = $id";
    const preparedStatement = await this.db.prepare(query);

    await preparedStatement.bind({ $id: id });
    const result = await preparedStatement.get();

    await preparedStatement.finalize();

    const todo = new Todo();

    todo.id = result.id;
    todo.title = result.title;

    return todo;
  }

  async first(): Promise<Todo> {
    const query = `SELECT * FROM ${this._table} ORDER BY ROWID ASC LIMIT 1`;
    const preparedStatement = await this.db.prepare(query);

    const result = await preparedStatement.get();

    await preparedStatement.finalize();

    const todo = new Todo();

    todo.id = result.id;
    todo.title = result.title;

    return todo;
  }

  async last(): Promise<Todo> {
    const query = `SELECT * FROM ${this._table} ORDER BY ROWID DESC LIMIT 1;`;
    const preparedStatement = await this.db.prepare(query);

    const result = await preparedStatement.get();

    await preparedStatement.finalize();

    const todo = new Todo();

    todo.id = result.id;
    todo.title = result.title;

    return todo;
  }

  async findAll(): Promise<Todo[]> {
    const query = `SELECT * FROM ${this._table}`;
    const preparedStatement = await this.db.prepare(query);
    const results = await preparedStatement.all();
    await preparedStatement.finalize();

    const todos: Todo[] = [];
    for (const result of results) {
      const todo = new Todo();

      todo.id = result.id;
      todo.title = result.title;
      todos.push(todo);
    }

    return todos;
  }

  async insert({ title }: { title: Todo["title"] }): Promise<Todo> {
    const query = `INSERT INTO ${this._table} (title) VALUES($title)`;
    const preparedStatement = await this.db.prepare(query);
    await preparedStatement.bind({ $title: title });

    const { lastID = 0 } = await preparedStatement.run();
    await preparedStatement.finalize();

    return this.findById(lastID);
  }

  async update(id: Todo["id"], todo: Partial<Todo>): Promise<number> {
    let set: string[] = [];

    for (const key of Object.keys(todo)) {
      set = [...set, `${key} = ?`];
    }

    const query = `UPDATE ${this._table} SET ${set.join(", ")} WHERE id = ?`;
    console.log({ query });
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
