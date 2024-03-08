import { Entity } from "@scream.js/database/entity.js";
import { Serializable } from "@scream.js/http/serializable.js";

export class Todo implements Entity, Serializable<Todo> {
  id = 0;
  title = "";
  updatedAt = new Date();
  createdAt = new Date();
  dueDate = new Date();

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
      dueDate: this.dueDate,
    };
  }
}
