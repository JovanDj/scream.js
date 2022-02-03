export class Todo {
  private readonly _title: string;
  private readonly _updatedAt: Date;
  private readonly _createdAt: Date;
  private readonly _dueDate: Date;

  get dueDate(): Date {
    return this._dueDate;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
  get title(): string {
    return this._title;
  }
}
