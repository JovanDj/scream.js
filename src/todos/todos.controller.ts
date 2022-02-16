import { HTTPContext } from "../../lib/http/http-context";

export class TodosController {
  find(context: HTTPContext) {
    return `${context.request.method?.toUpperCase()} ${context.request.url}`;
  }
}
