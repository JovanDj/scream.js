import { Controller } from "../../lib/controller";
import { HTTPContext } from "../../lib/http/http-context";

@Controller()
export class UsersController {
  async findAll({ request }: HTTPContext) {
    return { url: request.url, method: request.method };
  }

  async findOne({ request }: HTTPContext) {
    return { url: request.url, method: request.method };
  }
}
