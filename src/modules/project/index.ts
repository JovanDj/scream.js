import { ProjectController } from "./project.controller.js";

export const createProjectModule = () => {
	const projectController = new ProjectController();

	return { projectController };
};
