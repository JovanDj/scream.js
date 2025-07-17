import type {
	CreateTodoInput,
	TodoSchema,
	UpdateTodoInput,
} from "./todo.schema.js";

export interface TodoRepository {
	findById(id: number): Promise<TodoSchema | undefined>;
	findAll(): Promise<TodoSchema[]>;
	insert(input: CreateTodoInput): Promise<TodoSchema>;
	update(id: number, input?: UpdateTodoInput): Promise<TodoSchema>;
	delete(id: number): Promise<number>;
}
