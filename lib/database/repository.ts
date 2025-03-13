export interface Repository<T, ID = number> {
	findById(id: ID): Promise<T | undefined>;
	findAll(): Promise<T[]>;
	insert(input: Partial<T>): Promise<T>;
	update(id: ID, input?: Partial<T>): Promise<T>;
	delete(id: ID): Promise<number>;
}
