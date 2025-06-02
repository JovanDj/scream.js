import { ZodValidator } from "@scream.js/validator/zod-validator.js";
import { z } from "zod/v4";

export type TodoSchema = {
	id: number;
	title: string;
	userId: number;
};

const createTodoSchema = z.object({
	title: z.string().nonempty(),
	userId: z.coerce.number(),
});

export const createTodoValidator = new ZodValidator(createTodoSchema);

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = Partial<CreateTodoInput>;
