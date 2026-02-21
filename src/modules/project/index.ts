import type { Knex } from "knex";
import { ProjectController } from "./project.controller.js";
import { ProjectService } from "./project.service.js";

export const createProjectModule = ({ db }: { db: Knex }) => {
	// Single-use composition seam is kept intentionally for app bootstrap boundaries.
	const projectService = new ProjectService(db);
	const projectController = new ProjectController(projectService);

	return { projectController, projectService };
};
