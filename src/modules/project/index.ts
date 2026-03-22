import type { Database } from "@scream.js/database/db.js";
import { ProjectController } from "./project.controller.js";

export const createProjectModule = ({ db }: { db: Database }) => {
	const projectController = new ProjectController(db);

	return { projectController };
};
