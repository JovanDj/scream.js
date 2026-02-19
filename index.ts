import type { Knex } from "knex";
import { createTodoModule } from "@/modules/todo";

export const createCoreServices = ({ db }: { db: Knex }) => {
	const { todoService } = createTodoModule({ db });

	return { todoService };
};
