import type { CreateTodo, Todo, UpdateTodo } from "./todo.js";

export interface TodoRepository {
	findById(id: number): Promise<Todo | undefined>;
	findAll(): Promise<Todo[]>;
	insert(input: CreateTodo): Promise<Todo>;
	update(id: number, input: UpdateTodo): Promise<Todo>;
	delete(id: number): Promise<number>;
}
