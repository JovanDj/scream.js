import { User } from "../user.entity";
import { UserCreated } from "./user-created";

export class CreateUserCommand {
  constructor(private dto: Pick<User, "email">) {}

  execute() {
    const { email } = this.dto;

    const user = new User(email);

    new UserCreated(user);

    return user;
  }
}
