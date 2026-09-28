import type { Database } from "@scream.js/database/db.js";
import { DestroyController } from "../destroy.controller.js";
import { type TodoShowInput, todoShowInputSchema } from "./todo.schema.js";

export class TodosDestroyController extends DestroyController<TodoShowInput> {
	protected inputSchema() {
		return todoShowInputSchema;
	}

	protected async remove(input: TodoShowInput, db: Database) {
		return (await db("todos").where({ id: input.id }).del()) > 0;
	}

	protected redirectUrl() {
		return "/todos";
	}
}
