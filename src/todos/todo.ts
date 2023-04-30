import { Database } from "sqlite";

export abstract class Entity {
  static routes: Record<string, string>;
}

export class Todo extends Entity {
  private _id = 0;
  private _title = "";
  private _updatedAt = new Date();
  private _createdAt = new Date();
  private _dueDate = new Date();

  static routes = { findAll: "/todos", findOne: "/todos/:id" };

  constructor(private readonly db: Database) {
    super();
  }

  // Setters & Getters

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

  // Active record

  async findAll() {
    const query = `SELECT * FROM todos`;
    const preparedStatement = await this.db.prepare(query);
    const result = await preparedStatement.all<Todo[]>();

    await preparedStatement.finalize();

    return result;
  }

  async findOne(id: Todo["id"]) {
    const query = `SELECT * FROM todos WHERE todos.id = ?`;
    const preparedStatement = await this.db.prepare(query, [id]);
    const result = await preparedStatement.get<Todo>();

    await preparedStatement.finalize();

    return result;
  }
}
