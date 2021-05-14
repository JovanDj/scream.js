export class User {
  constructor(private _email: string) {}

  set email(email: string) {
    this._email = email;
  }

  get email() {
    return this._email;
  }
}
