import { Controller } from "../../lib/controller";
import { Model } from "../../lib/model";
import { User } from "./user";

@Controller()
export class UsersController {
  constructor(private userModel: Model<User>) {}

  async findAll(): Promise<User[]> {
    const users = await this.userModel.create(new User("Jovan"));

    console.log(users);
    return this.userModel.read();
  }

  async findOne(): Promise<User> {
    const users = await this.userModel.read();
    console.log(users);
    return users[0];
  }
}
