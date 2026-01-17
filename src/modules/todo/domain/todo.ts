export type Todo = {
	id: number;
	title: string;
	userId: number;
	completed: boolean;
};

export type TodoDto = Pick<Todo, "title" | "completed">;
