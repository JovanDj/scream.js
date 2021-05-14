import { Todo } from "../todo.entity";

export class TodoCreated {
  constructor(
    private readonly _todo: Todo,
    private readonly _time: Date = new Date()
  ) {
    console.log(`
    Event: "Todo Created"
    time: ${this._time.toLocaleDateString()}
    todo: ${this._todo.description}
    `);
  }

  get todo(): Todo {
    return this._todo;
  }

  get time(): TodoCreated["_time"] {
    return this._time;
  }
}
