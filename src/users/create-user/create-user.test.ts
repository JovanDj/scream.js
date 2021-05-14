import { User } from "../user.entity";
import { CreateUserCommand } from "./create-user";

describe("Create user command", () => {
  let dto: Pick<User, "email"> = { email: "test@mail.com" };
  let user: User;

  beforeEach(() => {
    dto = { email: "test@mail.com" };
    user = new CreateUserCommand(dto).execute();
  });

  it("should create user", () => {
    expect(user).toBeInstanceOf(User);
  });

  it("should create user with correct inputs", () => {
    expect(user.email).toBe(dto.email);
  });
});
