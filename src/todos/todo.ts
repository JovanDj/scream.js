export class Todo {
  private _id = 0;
  private _title = "";
  private _updatedAt = new Date();
  private _createdAt = new Date();
  private _dueDate = new Date();

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
