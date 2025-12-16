import { ZodValidator } from "@scream.js/validator/zod-validator.js";
import z from "zod/v4";

export const todoSchema = z.strictObject({
	completed: z.stringbool().default(false),
	title: z.string().nonempty(),
});

export const todoValidator = new ZodValidator(todoSchema);

export type TodoInput = z.core.output<typeof todoSchema>;
