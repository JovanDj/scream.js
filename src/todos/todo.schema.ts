import { ZodValidator } from "@scream.js/validator/zod-validator.js";
import z from "zod/v4";

export const createTodoSchema = z.strictObject({
	title: z.string().nonempty(),
	userId: z.coerce.number(),
});

const todoSchema = createTodoSchema.safeExtend({ id: z.coerce.number() });

export const createTodoValidator = new ZodValidator(createTodoSchema);

export type TodoSchema = z.core.output<typeof todoSchema>;
export type CreateTodoInput = z.core.output<typeof createTodoSchema>;
export type UpdateTodoInput = Partial<CreateTodoInput>;
