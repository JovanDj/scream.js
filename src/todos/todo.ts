import type { Database } from "../../lib/database/database";
import type { Entity } from "../../lib/database/entity";

export class Todo implements Entity {
  private _id = 0;
  private _title = "";
  private _updatedAt = new Date();
  private _createdAt = new Date();
  private _dueDate = new Date();

  constructor(private readonly db: Database) {}

  // Setters & Getters

  get id() {
    return this._id;
  }

  set id(id) {
    this._id = id;
  }

  get dueDate() {
    return this._dueDate;
  }

  set dueDate(date) {
    this._dueDate = date;
  }

  get createdAt() {
    return this._createdAt;
  }

  set createdAt(date) {
    this._createdAt = date;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  set updatedAt(date) {
    this._updatedAt = date;
  }

  get title() {
    return this._title;
  }

  set title(title) {
    this._title = title;
  }
}
