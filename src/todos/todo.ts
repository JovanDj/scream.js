import { Entity } from "../../lib/database/entity.js";

export class Todo implements Entity {
  private _id = 0;
  private _title = "";
  private _updatedAt = new Date();
  private _createdAt = new Date();
  private _dueDate = new Date();

  get id() {
    return this._id;
  }

  get dueDate() {
    return this._dueDate;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  get title() {
    return this._title;
  }

  set id(id) {
    this._id = id;
  }

  set dueDate(date) {
    this._dueDate = date;
  }

  set createdAt(date) {
    this._createdAt = date;
  }

  set updatedAt(date) {
    this._updatedAt = date;
  }

  set title(title) {
    this._title = title;
  }
}
