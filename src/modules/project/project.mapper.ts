import { Project, type ProjectWriteInput } from "./project.js";
import type { ProjectRow } from "./project.schema.js";

export const toProject = (row: ProjectRow) => {
	return new Project({
		createdAt: row.created_at,
		id: row.id,
		name: row.name,
		statusCode: row.status_code,
		updatedAt: row.updated_at,
	});
};

export const toProjectInsertRecord = (
	input: Readonly<ProjectWriteInput>,
	now: string,
	statusId: number,
) => {
	return {
		created_at: now,
		name: input.name,
		status_id: statusId,
		updated_at: now,
	};
};

export const toProjectUpdateRecord = (project: Project, statusId: number) => {
	return {
		name: project.name,
		status_id: statusId,
		updated_at: project.updatedAt,
	};
};
