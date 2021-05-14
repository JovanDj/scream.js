import { User } from "../user.entity";

export class UserCreated {
  constructor(
    private readonly _user: User,
    private readonly _time: Date = new Date()
  ) {
    console.log(`
    Event: "User Created"
    time: ${this._time.toLocaleDateString()}
    user: ${this._user.email}
    `);
  }

  get user() {
    return this._user;
  }

  get time() {
    return this._time;
  }
}
