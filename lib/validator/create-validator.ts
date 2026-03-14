import type z from "zod/v4";
import { ZodValidator } from "./zod-validator.js";

export const createValidator = <S extends z.core.$ZodType>(schema: S) => {
	return new ZodValidator(schema);
};
