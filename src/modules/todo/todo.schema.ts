import { createValidator } from "@scream.js/validator/create-validator.js";
import { schema } from "@scream.js/validator/schema.js";
import type { TodoPriority, TodoScope, TodoStatusCode } from "./todo.js";

export type TodoCreateFields = {
	description: string;
	dueAt: string | null;
	priority: TodoPriority;
	projectId?: number | undefined;
	statusCode: TodoStatusCode;
	title: string;
};

export type TodoUpdateFields = TodoCreateFields;

export type TodoListQuery = {
	projectId?: number;
	search: string;
	status: TodoScope;
};

export type TodoRow = {
	completed_at?: string | null | undefined;
	created_at?: string | undefined;
	description?: string | undefined;
	due_at?: string | null | undefined;
	id: number;
	priority_code?: TodoPriority | undefined;
	project_id?: number | null | undefined;
	status_code?: TodoStatusCode | undefined;
	title: string;
	updated_at?: string | undefined;
};

const dueAtValidator = schema
	.string()
	.optional()
	.default("")
	.transform((value) => value.trim())
	.refine(
		(value) => value.length < 1 || !Number.isNaN(new Date(value).getTime()),
		{
			message: "Invalid date",
		},
	)
	.transform((value) => {
		if (value.length < 1) {
			return null;
		}

		return new Date(value).toISOString();
	});

export const todoIdValidator = createValidator(
	schema.coerce.number().int().positive(),
);

export const todoListQueryValidator = createValidator(
	schema.object({
		projectId: schema.coerce.number().int().positive().optional(),
		search: schema
			.string()
			.optional()
			.default("")
			.transform((value) => value.trim()),
		status: schema
			.enum(["all", "completed", "dueToday", "open", "overdue"])
			.optional()
			.default("all"),
	}),
);

export const todoCreateValidator = createValidator(
	schema.strictObject({
		description: schema
			.string()
			.default("")
			.transform((value) => value.trim()),
		dueAt: dueAtValidator,
		priority: schema.enum(["low", "medium", "high"]).default("medium"),
		projectId: schema.preprocess(
			(value) => (value === "" ? undefined : value),
			schema.coerce.number().int().positive().optional(),
		),
		statusCode: schema.enum(["open", "completed"]).default("open"),
		title: schema
			.string()
			.default("")
			.transform((value) => value.trim())
			.refine((value) => value.length > 0, {
				message: "Required",
			}),
	}),
);

export const todoUpdateValidator = createValidator(
	schema.strictObject({
		description: schema
			.string()
			.default("")
			.transform((value) => value.trim()),
		dueAt: dueAtValidator,
		priority: schema.enum(["low", "medium", "high"]).default("medium"),
		projectId: schema.preprocess(
			(value) => (value === "" ? undefined : value),
			schema.coerce.number().int().positive().optional(),
		),
		statusCode: schema.enum(["open", "completed"]).default("open"),
		title: schema
			.string()
			.default("")
			.transform((value) => value.trim())
			.refine((value) => value.length > 0, {
				message: "Required",
			}),
	}),
);

export const todoRowValidator = createValidator(
	schema.object({
		completed_at: schema.string().nullable().optional(),
		created_at: schema.string().optional(),
		description: schema.string().optional(),
		due_at: schema.string().nullable().optional(),
		id: schema.coerce.number(),
		priority_code: schema.enum(["low", "medium", "high"]).optional(),
		project_id: schema.coerce.number().nullable().optional(),
		status_code: schema.enum(["open", "completed"]).optional(),
		title: schema.string().nonempty(),
		updated_at: schema.string().optional(),
	}),
);

export const todoScopes: readonly TodoScope[] = [
	"all",
	"completed",
	"dueToday",
	"open",
	"overdue",
];
