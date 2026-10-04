import { DestroyController } from "@scream.js/http/controllers/destroy.controller.js";
import { type TodoShowInput, todoShowInputSchema } from "../todo.schema.js";

export class TodosDestroyController extends DestroyController<TodoShowInput> {
	protected inputSchema() {
		return todoShowInputSchema;
	}

	protected redirectUrl() {
		return "/todos";
	}
}
