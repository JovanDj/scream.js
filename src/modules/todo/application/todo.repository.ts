import type { Todo, TodoDto } from "../domain/todo.js";

export interface TodoRepository {
	findById(id: number): Promise<Todo | undefined>;
	findAll(): Promise<Todo[]>;
	insert(input: TodoDto): Promise<Todo>;
	update(id: number, input: TodoDto): Promise<Todo>;
	delete(id: number): Promise<number>;
}
