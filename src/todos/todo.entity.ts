export class Todo {
  constructor(private _description: string) {}

  set description(description: string) {
    this._description = description;
  }

  get description(): Todo["_description"] {
    return this._description;
  }
}
