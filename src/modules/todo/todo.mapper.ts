import { Todo, type TodoSnapshot, type TodoWriteInput } from "./todo.js";
import type { TodoRow } from "./todo.schema.js";

export const toTodo = (row: TodoRow) => {
	const snapshot: TodoSnapshot = {
		completedAt: row.completed_at ?? null,
		createdAt: row.created_at ?? new Date().toISOString(),
		description: row.description ?? "",
		dueAt: row.due_at ?? null,
		id: row.id,
		priority: row.priority_code ?? "medium",
		projectId: row.project_id ?? null,
		statusCode: row.status_code ?? "open",
		title: row.title,
		updatedAt: row.updated_at ?? new Date().toISOString(),
	};

	return new Todo(snapshot);
};

export const toTodoInsertRecord = (
	input: Readonly<TodoWriteInput>,
	now: string,
	priorityId: number,
	statusId: number,
) => {
	return {
		completed_at: input.statusCode === "completed" ? now : null,
		created_at: now,
		description: input.description,
		due_at: input.dueAt,
		priority_id: priorityId,
		project_id: input.projectId,
		status_id: statusId,
		title: input.title,
		updated_at: now,
	};
};

export const toTodoUpdateRecord = (
	todo: Todo,
	priorityId: number,
	statusId: number,
) => {
	return {
		completed_at: todo.completedAt,
		description: todo.description,
		due_at: todo.dueAt,
		priority_id: priorityId,
		project_id: todo.projectId,
		status_id: statusId,
		title: todo.title,
		updated_at: todo.updatedAt,
	};
};
