export interface Serializable<T> {
	toJSON(): Partial<T>;
}
