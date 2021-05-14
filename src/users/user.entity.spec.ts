import { User } from "./user.entity";

describe("User", () => {
  let user: User;

  beforeEach(() => {
    user = new User("test@mail.com");
  });

  it("should create user", () => {
    expect(user).toBeInstanceOf(User);
  });

  it("should get email", () => {
    expect(user.email).toBe("test@mail.com");
  });

  it("should set email", () => {
    user.email = "new-email.com";
    expect(user.email).toBe("new-email.com");
    expect(user.email).not.toBe("test@mail.com");
  });
});
