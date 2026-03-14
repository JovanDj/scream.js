import { Tag, type TagWriteInput } from "./tag.js";
import type { TagRow } from "./tag.schema.js";

export const toTag = (row: TagRow) => {
	return new Tag({
		createdAt: row.created_at,
		id: row.id,
		name: row.name,
	});
};

export const toTagInsertRecord = (
	input: Readonly<TagWriteInput>,
	now: string,
) => {
	return {
		created_at: now,
		name: input.name,
		updated_at: now,
	};
};
