import type { Database } from "@scream.js/database/db.js";
import { ProjectController } from "./project.controller.js";
import { ProjectService } from "./project.service.js";

export const createProjectModule = ({ db }: { db: Database }) => {
	const projectService = new ProjectService(db);
	const projectController = new ProjectController(projectService);

	return { projectController, projectService };
};
