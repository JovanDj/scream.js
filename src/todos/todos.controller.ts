import { Controller } from "../../lib/controller";
import { Repository } from "../../lib/repository";
import { Todo } from "./todo";

export class TodosController extends Controller<Todo> {
  constructor(private readonly repository: Repository<Todo>) {
    super(repository);
  }
}
