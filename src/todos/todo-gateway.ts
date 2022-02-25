import { Database } from "sqlite";

export class TodoGateway {
  private readonly _table = "todos";

  private _id = 1;
  private _title = "";
  private _updatedAt = new Date();
  private _createdAt = new Date();
  private _dueDate = new Date();

  constructor(private readonly db: Database) {}

  async findById(id: number): Promise<TodoGateway> {
    const query = "SELECT * FROM todos WHERE id = $id";
    const preparedStatement = await this.db.prepare(query);

    await preparedStatement.bind({ $id: id });
    const result = await preparedStatement.get();

    await preparedStatement.finalize();

    const todo = new TodoGateway(this.db);

    todo.id = result.id;
    todo.title = result.title;

    return todo;
  }

  async first(): Promise<TodoGateway> {
    const query = `SELECT * FROM ${this._table} ORDER BY ROWID ASC LIMIT 1`;
    const preparedStatement = await this.db.prepare(query);

    const result = await preparedStatement.get();

    await preparedStatement.finalize();

    const todo = new TodoGateway(this.db);

    todo.id = result.id;
    todo.title = result.title;

    return todo;
  }

  async last(): Promise<TodoGateway> {
    const query = `SELECT * FROM ${this._table} ORDER BY ROWID DESC LIMIT 1;`;
    const preparedStatement = await this.db.prepare(query);

    const result = await preparedStatement.get();

    await preparedStatement.finalize();

    const todo = new TodoGateway(this.db);

    todo.id = result.id;
    todo.title = result.title;

    return todo;
  }

  async findAll(): Promise<TodoGateway[]> {
    const query = `SELECT * FROM ${this._table}`;
    const preparedStatement = await this.db.prepare(query);
    const results = await preparedStatement.all();
    await preparedStatement.finalize();

    const todos: TodoGateway[] = [];
    for (const result of results) {
      const todo = new TodoGateway(this.db);

      todo.id = result.id;
      todo.title = result.title;
      todos.push(todo);
    }

    return todos;
  }

  async insert({
    title
  }: {
    title: TodoGateway["title"];
  }): Promise<TodoGateway> {
    const query = `INSERT INTO ${this._table} (title) VALUES($title)`;
    const preparedStatement = await this.db.prepare(query);
    await preparedStatement.bind({ $title: title });

    const { lastID = 0 } = await preparedStatement.run();
    await preparedStatement.finalize();

    return this.findById(lastID);
  }

  async update(
    id: TodoGateway["id"],
    todo: Partial<TodoGateway>
  ): Promise<number> {
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

  async delete(id: TodoGateway["id"]): Promise<number> {
    const query = `DELETE FROM ${this._table} WHERE id = $id`;
    const preparedStatement = await this.db.prepare(query);
    await preparedStatement.bind({ $id: id });

    const { changes = 0 } = await preparedStatement.run();
    await preparedStatement.finalize();

    return changes;
  }

  get id(): number {
    return this._id;
  }

  set id(id) {
    this._id = id;
  }

  get dueDate(): Date {
    return this._dueDate;
  }

  set dueDate(date) {
    this._dueDate = date;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  set createdAt(date) {
    this._createdAt = date;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  set updatedAt(date) {
    this._updatedAt = date;
  }

  get title(): string {
    return this._title;
  }

  set title(title) {
    this._title = title;
  }
}
