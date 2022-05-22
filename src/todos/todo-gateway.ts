import { Gateway } from "../../lib/gateway";
import { Todo } from "./todo";

export class TodoGateway extends Gateway<Todo> {
  private readonly table = "todos";

  constructor(private readonly db: Database) {
    super(db);
  }
}
