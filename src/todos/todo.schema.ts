export type TodoSchema = {
	id: number;
	title: string;
	userId: number;
};

export type CreateTodoInput = Omit<TodoSchema, "id">;
export type UpdateTodoInput = Partial<CreateTodoInput>;
