export type Todo = {
	id: number;
	title: string;
	userId: number;
};

export type CreateTodo = Pick<Todo, "title" | "userId">;

export type UpdateTodo = Partial<CreateTodo>;
